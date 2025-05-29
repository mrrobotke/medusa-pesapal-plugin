import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import fs from "fs/promises"
import path from "path"

const CONFIG_FILE_PATH = path.join(process.cwd(), "pesapal-config.json")

interface PesapalConfig {
  consumer_key: string
  consumer_secret: string
  environment: "sandbox" | "live"
  currency: string
  merchant_name?: string
  ipn_url?: string
  enabled: boolean
}

async function loadConfig(): Promise<PesapalConfig | null> {
  try {
    const data = await fs.readFile(CONFIG_FILE_PATH, "utf8")
    return JSON.parse(data)
  } catch (error) {
    return null
  }
}

async function saveConfig(config: PesapalConfig): Promise<void> {
  await fs.writeFile(CONFIG_FILE_PATH, JSON.stringify(config, null, 2))
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const config = await loadConfig()
    
    if (config) {
      // Don't expose the consumer secret in the response
      const { consumer_secret, ...safeConfig } = config
      res.json({ 
        config: {
          ...safeConfig,
          consumer_secret: consumer_secret ? "****" : ""
        }
      })
    } else {
      res.json({ 
        config: {
          consumer_key: "",
          consumer_secret: "",
          environment: "sandbox",
          currency: "KES",
          merchant_name: "",
          ipn_url: "",
          enabled: false
        }
      })
    }
  } catch (error) {
    console.error("Failed to load Pesapal config:", error)
    res.status(500).json({ 
      message: "Failed to load configuration",
      error: error.message 
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { config } = req.body as { config: PesapalConfig }

    // Validate required fields
    if (!config.consumer_key || !config.consumer_secret) {
      return res.status(400).json({
        message: "Consumer key and consumer secret are required"
      })
    }

    // Validate environment
    if (!["sandbox", "live"].includes(config.environment)) {
      return res.status(400).json({
        message: "Environment must be either 'sandbox' or 'live'"
      })
    }

    await saveConfig(config)
    
    res.json({ 
      message: "Configuration saved successfully",
      config: {
        ...config,
        consumer_secret: "****" // Don't expose the secret in response
      }
    })
  } catch (error) {
    console.error("Failed to save Pesapal config:", error)
    res.status(500).json({ 
      message: "Failed to save configuration",
      error: error.message 
    })
  }
} 