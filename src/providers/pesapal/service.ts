import { AbstractPaymentProvider } from "@medusajs/framework/utils"
import {
  InitiatePaymentInput,
  InitiatePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  PaymentSessionStatus,
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  RefundPaymentInput,
  RefundPaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  WebhookActionResult,
  ProviderWebhookPayload,
} from "@medusajs/framework/types"
import crypto from "crypto"

export interface PesapalOptions {
  consumer_key: string
  consumer_secret: string
  environment: "sandbox" | "live"
  currency: string
  merchant_name?: string
  ipn_url?: string
}

interface PesapalAuthResponse {
  token: string
  expiryDate: string
  error?: string
  message?: string
}

interface PesapalOrderResponse {
  order_tracking_id: string
  merchant_reference: string
  redirect_url: string
  error?: string
  message?: string
}

interface PesapalTransactionStatus {
  payment_method: string
  amount: number
  created_date: string
  confirmation_code: string
  payment_status_description: string
  description: string
  message: string
  payment_account: string
  call_back_url: string
  status_code: number
  merchant_reference: string
  payment_status_code: string
  currency: string
}

export class PesapalProviderService extends AbstractPaymentProvider<PesapalOptions> {
  static identifier = "pesapal"
  
  protected readonly options_: PesapalOptions
  protected logger_: any
  private authToken: string | null = null
  private tokenExpiry: Date | null = null

  constructor(
    container: any,
    options: PesapalOptions
  ) {
    super(container, options)
    
    this.options_ = options
    this.logger_ = container.logger
    
    // Validate required options
    if (!options.consumer_key || !options.consumer_secret) {
      throw new Error("Pesapal consumer_key and consumer_secret are required")
    }
  }

  private get baseUrl(): string {
    return this.options_.environment === "live" 
      ? "https://pay.pesapal.com/v3" 
      : "https://cybqa.pesapal.com/pesapalv3"
  }

  private async getAuthToken(): Promise<string> {
    // Check if we have a valid token
    if (this.authToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.authToken
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/Auth/RequestToken`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          consumer_key: this.options_.consumer_key,
          consumer_secret: this.options_.consumer_secret,
        }),
      })

      const data: PesapalAuthResponse = await response.json()

      if (data.error || !data.token) {
        throw new Error(`Pesapal authentication failed: ${data.message || data.error}`)
      }

      this.authToken = data.token
      this.tokenExpiry = new Date(data.expiryDate)
      
      return this.authToken
    } catch (error) {
      this.logger_.error("Failed to get Pesapal auth token", error)
      throw new Error("Failed to authenticate with Pesapal")
    }
  }

  private async makeAuthenticatedRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.getAuthToken()
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Pesapal API error: ${response.status} ${errorText}`)
    }

    return response.json()
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    try {
      const { currency_code, amount, context: sessionContext } = input
      const { customer, billing_address } = (sessionContext || {}) as any

      // Generate a unique merchant reference
      const merchantReference = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Prepare order data
      const orderData = {
        id: merchantReference,
        currency: currency_code.toUpperCase(),
        amount: Number(amount) / 100, // Convert from cents to major currency unit
        description: `Payment for order ${merchantReference}`,
        callback_url: this.options_.ipn_url || `${process.env.BACKEND_URL}/store/pesapal/webhook`,
        notification_id: await this.getIpnId(),
        billing_address: {
          email_address: customer?.email || (billing_address as any)?.email || "customer@example.com",
          phone_number: (billing_address as any)?.phone || customer?.phone || "",
          country_code: (billing_address as any)?.country_code || "KE",
          first_name: (billing_address as any)?.first_name || customer?.first_name || "Customer",
          middle_name: (billing_address as any)?.address_2 || "",
          last_name: (billing_address as any)?.last_name || customer?.last_name || "",
          line_1: (billing_address as any)?.address_1 || "",
          line_2: (billing_address as any)?.address_2 || "",
          city: (billing_address as any)?.city || "",
          state: (billing_address as any)?.province || "",
          postal_code: (billing_address as any)?.postal_code || "",
          zip_code: (billing_address as any)?.postal_code || "",
        },
      }

      const response: PesapalOrderResponse = await this.makeAuthenticatedRequest(
        "/api/Transactions/SubmitOrderRequest",
        {
          method: "POST",
          body: JSON.stringify(orderData),
        }
      )

      if (response.error) {
        throw new Error(`Pesapal order submission failed: ${response.message}`)
      }

      return {
        id: response.order_tracking_id,
        data: {
          order_tracking_id: response.order_tracking_id,
          merchant_reference: response.merchant_reference,
          redirect_url: response.redirect_url,
          amount: amount,
          currency: currency_code,
          status: "pending",
        },
      }
    } catch (error) {
      this.logger_.error("Failed to initiate Pesapal payment", error)
      throw new Error("Failed to initiate payment")
    }
  }

  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    try {
      const { order_tracking_id } = (input.data || {}) as any

      // Get transaction status from Pesapal
      const statusResponse: PesapalTransactionStatus = await this.makeAuthenticatedRequest(
        `/api/Transactions/GetTransactionStatus?orderTrackingId=${order_tracking_id}`
      )

      const status = this.mapPesapalStatus(statusResponse.payment_status_description)
      
      return {
        status: status,
        data: {
          ...input.data,
          payment_status: statusResponse.payment_status_description,
          confirmation_code: statusResponse.confirmation_code,
          payment_method: statusResponse.payment_method,
          payment_account: statusResponse.payment_account,
          status: status,
        },
      }
    } catch (error) {
      this.logger_.error("Failed to authorize Pesapal payment", error)
      throw new Error("Failed to authorize payment")
    }
  }

  async capturePayment(
    input: CapturePaymentInput
  ): Promise<CapturePaymentOutput> {
    try {
      // Pesapal doesn't have a separate capture step - payment is captured upon authorization
      const { order_tracking_id } = (input.data || {}) as any

      const statusResponse: PesapalTransactionStatus = await this.makeAuthenticatedRequest(
        `/api/Transactions/GetTransactionStatus?orderTrackingId=${order_tracking_id}`
      )

      return {
        data: {
          ...input.data,
          payment_status: statusResponse.payment_status_description,
          confirmation_code: statusResponse.confirmation_code,
          status: "captured",
        },
      }
    } catch (error) {
      this.logger_.error("Failed to capture Pesapal payment", error)
      throw new Error("Failed to capture payment")
    }
  }

  async refundPayment(
    input: RefundPaymentInput
  ): Promise<RefundPaymentOutput> {
    try {
      const { confirmation_code } = (input.data || {}) as any
      const { amount } = input

      // Prepare refund data
      const refundData = {
        confirmation_code: confirmation_code,
        amount: Number(amount) / 100, // Convert from cents
        username: this.options_.merchant_name || "merchant",
        remarks: `Refund for payment ${confirmation_code}`,
      }

      const response = await this.makeAuthenticatedRequest(
        "/api/Transactions/RefundRequest",
        {
          method: "POST",
          body: JSON.stringify(refundData),
        }
      )

      return {
        data: {
          ...input.data,
          refund_status: "refunded",
          refund_amount: amount,
          refund_response: response,
        },
      }
    } catch (error) {
      this.logger_.error("Failed to refund Pesapal payment", error)
      throw new Error("Failed to refund payment")
    }
  }

  async cancelPayment(
    input: CancelPaymentInput
  ): Promise<CancelPaymentOutput> {
    try {
      // Pesapal doesn't have explicit cancel - we just mark it as cancelled
      return {
        data: {
          ...input.data,
          status: "canceled",
          canceled_at: new Date().toISOString(),
        },
      }
    } catch (error) {
      this.logger_.error("Failed to cancel Pesapal payment", error)
      throw new Error("Failed to cancel payment")
    }
  }

  async deletePayment(
    input: DeletePaymentInput
  ): Promise<DeletePaymentOutput> {
    // Return the session data as-is since Pesapal doesn't support deleting payments
    return {
      data: input.data,
    }
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    try {
      const { order_tracking_id } = (input.data || {}) as any

      // Get transaction status from Pesapal
      const statusResponse: PesapalTransactionStatus = await this.makeAuthenticatedRequest(
        `/api/Transactions/GetTransactionStatus?orderTrackingId=${order_tracking_id}`
      )

      return {
        data: {
          ...input.data,
          payment_status: statusResponse.payment_status_description,
          confirmation_code: statusResponse.confirmation_code,
          payment_method: statusResponse.payment_method,
          payment_account: statusResponse.payment_account,
          amount: statusResponse.amount,
          currency: statusResponse.currency,
          created_date: statusResponse.created_date,
        },
      }
    } catch (error) {
      this.logger_.error("Failed to retrieve Pesapal payment", error)
      throw new Error("Failed to retrieve payment")
    }
  }

  async updatePayment(
    input: UpdatePaymentInput
  ): Promise<UpdatePaymentOutput> {
    // Return the current session data since Pesapal doesn't support updating payments
    return { 
      data: input.data,
    }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    try {
      const { order_tracking_id } = (input.data || {}) as any

      // Get transaction status from Pesapal
      const statusResponse: PesapalTransactionStatus = await this.makeAuthenticatedRequest(
        `/api/Transactions/GetTransactionStatus?orderTrackingId=${order_tracking_id}`
      )

      const status = this.mapPesapalStatus(statusResponse.payment_status_description)

      return {
        status: status,
        data: {
          ...input.data,
          payment_status: statusResponse.payment_status_description,
          confirmation_code: statusResponse.confirmation_code,
          status: status,
        },
      }
    } catch (error) {
      this.logger_.error("Failed to get Pesapal payment status", error)
      return {
        status: "pending",
        data: input.data,
      }
    }
  }

  async getWebhookActionAndData(
    data: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    try {
      const webhookData = data.data as any
      const { OrderTrackingId, OrderMerchantReference } = webhookData

      if (!OrderTrackingId) {
        return { action: "not_supported" }
      }

      // Get the current status from Pesapal
      const statusResponse: PesapalTransactionStatus = await this.makeAuthenticatedRequest(
        `/api/Transactions/GetTransactionStatus?orderTrackingId=${OrderTrackingId}`
      )

      const status = this.mapPesapalStatus(statusResponse.payment_status_code)

      let action: "authorized" | "captured" | "failed" | "not_supported" = "not_supported"
      
      switch (status) {
        case "authorized":
          action = "authorized"
          break
        case "captured":
          action = "captured"
          break
        case "error":
          action = "failed"
          break
        default:
          action = "not_supported"
      }

      return {
        action: action,
        data: {
          session_id: String(OrderMerchantReference),
          amount: statusResponse.amount * 100, // Convert to cents
        },
      }
    } catch (error) {
      this.logger_.error("Failed to process Pesapal webhook", error)
      return { action: "failed" }
    }
  }

  private mapPesapalStatus(pesapalStatus: string): PaymentSessionStatus {
    switch (pesapalStatus) {
      case "0":
        return "pending"
      case "1":
        return "authorized"
      case "2":
        return "captured"
      case "3":
        return "canceled"
      default:
        return "error"
    }
  }

  private async getIpnId(): Promise<string> {
    try {
      // First, try to get existing IPN registrations
      const ipnList = await this.makeAuthenticatedRequest("/api/URLSetup/GetIpnList")
      
      // Check if we already have an IPN registered for our URL
      const existingIpn = ipnList.find((ipn: any) => 
        ipn.url === this.options_.ipn_url && ipn.status === "Active"
      )
      
      if (existingIpn) {
        return existingIpn.ipn_id
      }

      // Register new IPN if none exists
      const ipnData = {
        url: this.options_.ipn_url || `${process.env.BACKEND_URL}/store/pesapal/webhook`,
        ipn_notification_type: "GET",
      }

      const response = await this.makeAuthenticatedRequest("/api/URLSetup/RegisterIPN", {
        method: "POST",
        body: JSON.stringify(ipnData),
      })

      return response.ipn_id
    } catch (error) {
      this.logger_.error("Failed to get/register IPN", error)
      // Return a default IPN ID or throw error based on your preference
      throw new Error("Failed to setup IPN registration")
    }
  }
}

export default PesapalProviderService 