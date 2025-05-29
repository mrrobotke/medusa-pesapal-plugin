import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

interface PesapalConfig {
  consumer_key: string
  consumer_secret: string
  environment: "sandbox" | "live"
  currency: string
  merchant_name?: string
  ipn_url?: string
  enabled: boolean
}

interface PesapalAuthResponse {
  token: string
  expiryDate: string
  error?: string
  message?: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { config } = req.body as { config: PesapalConfig }

    // Validate required fields
    if (!config.consumer_key || !config.consumer_secret) {
      return res.status(400).json({
        success: false,
        message: "Consumer key and consumer secret are required"
      })
    }

    const baseUrl = config.environment === "live" 
      ? "https://pay.pesapal.com/v3" 
      : "https://cybqa.pesapal.com/pesapalv3"

    // Test authentication with Pesapal
    const response = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        consumer_key: config.consumer_key,
        consumer_secret: config.consumer_secret,
      }),
    })

    const data: PesapalAuthResponse = await response.json()

    if (data.error || !data.token) {
      return res.status(400).json({
        success: false,
        message: `Authentication failed: ${data.message || data.error || "Invalid credentials"}`
      })
    }

    // If we get here, authentication was successful
    res.json({
      success: true,
      message: `Successfully connected to Pesapal ${config.environment} environment`,
      token_expires: data.expiryDate
    })

  } catch (error) {
    console.error("Failed to test Pesapal connection:", error)
    res.status(500).json({
      success: false,
      message: "Failed to test connection",
      error: error.message
    })
  }
} 