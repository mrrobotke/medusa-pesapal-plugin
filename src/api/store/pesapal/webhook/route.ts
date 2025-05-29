import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { OrderTrackingId, OrderMerchantReference } = req.query

    if (!OrderTrackingId) {
      return res.status(400).json({
        message: "Missing OrderTrackingId parameter"
      })
    }

    // Process the webhook data
    const webhookData = {
      OrderTrackingId,
      OrderMerchantReference,
      timestamp: new Date().toISOString()
    }

    // Log the webhook for debugging
    console.log("Pesapal webhook received:", webhookData)

    // Here you would typically:
    // 1. Get the payment provider service
    // 2. Process the webhook using the service's processWebhook method
    // 3. Update the order status based on the payment status

    // For now, we'll just return success
    res.status(200).json({
      message: "Webhook processed successfully",
      data: webhookData
    })

  } catch (error) {
    console.error("Failed to process Pesapal webhook:", error)
    res.status(500).json({
      message: "Failed to process webhook",
      error: error.message
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const webhookData = req.body

    console.log("Pesapal POST webhook received:", webhookData)

    // Process POST webhook data
    // This would be similar to the GET handler but for POST requests

    res.status(200).json({
      message: "POST webhook processed successfully",
      data: webhookData
    })

  } catch (error) {
    console.error("Failed to process Pesapal POST webhook:", error)
    res.status(500).json({
      message: "Failed to process POST webhook",
      error: error.message
    })
  }
} 