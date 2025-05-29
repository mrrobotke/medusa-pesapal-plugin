import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { 
  Container, 
  Heading, 
  Input, 
  Label, 
  Button, 
  Select, 
  Text,
  Switch,
  toast
} from "@medusajs/ui"
import { useState, useEffect } from "react"

const PesapalConfigurationWidget = () => {
  const [config, setConfig] = useState({
    consumer_key: "",
    consumer_secret: "",
    environment: "sandbox" as "sandbox" | "live",
    currency: "KES",
    merchant_name: "",
    ipn_url: "",
    enabled: false
  })
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Load current configuration
  useEffect(() => {
    const loadConfiguration = async () => {
      setLoading(true)
      try {
        const response = await fetch("/admin/custom/pesapal/config", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          setConfig(data.config || config)
        }
      } catch (error) {
        console.error("Failed to load Pesapal configuration:", error)
        toast.error("Failed to load configuration")
      } finally {
        setLoading(false)
      }
    }

    loadConfiguration()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch("/admin/custom/pesapal/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ config }),
      })

      if (response.ok) {
        toast.success("Pesapal configuration saved successfully")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to save configuration")
      }
    } catch (error) {
      console.error("Failed to save Pesapal configuration:", error)
      toast.error("Failed to save configuration")
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch("/admin/custom/pesapal/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ config }),
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        toast.success("Connection test successful!")
      } else {
        toast.error(result.message || "Connection test failed")
      }
    } catch (error) {
      console.error("Failed to test Pesapal connection:", error)
      toast.error("Failed to test connection")
    } finally {
      setLoading(false)
    }
  }

  if (loading && !config.consumer_key) {
    return (
      <Container>
        <div className="flex items-center justify-center p-8">
          <Text>Loading Pesapal configuration...</Text>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Heading level="h2">Pesapal Configuration</Heading>
            <Text className="text-ui-fg-subtle">
              Configure your Pesapal payment gateway settings
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={config.enabled}
              onCheckedChange={(checked) => 
                setConfig(prev => ({ ...prev, enabled: checked }))
              }
            />
            <Label>Enable Pesapal</Label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Environment Selection */}
          <div className="md:col-span-2">
            <Label htmlFor="environment">Environment</Label>
            <Select
              value={config.environment}
              onValueChange={(value: "sandbox" | "live") => 
                setConfig(prev => ({ ...prev, environment: value }))
              }
            >
              <Select.Trigger className="w-full">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="sandbox">Sandbox (Testing)</Select.Item>
                <Select.Item value="live">Live (Production)</Select.Item>
              </Select.Content>
            </Select>
            <Text size="small" className="text-ui-fg-subtle mt-1">
              Use sandbox for testing and live for production
            </Text>
          </div>

          {/* Consumer Key */}
          <div>
            <Label htmlFor="consumer_key">Consumer Key</Label>
            <Input
              id="consumer_key"
              type="text"
              placeholder="Enter your Pesapal consumer key"
              value={config.consumer_key}
              onChange={(e) => 
                setConfig(prev => ({ ...prev, consumer_key: e.target.value }))
              }
            />
            <Text size="small" className="text-ui-fg-subtle mt-1">
              Your Pesapal consumer key from the merchant dashboard
            </Text>
          </div>

          {/* Consumer Secret */}
          <div>
            <Label htmlFor="consumer_secret">Consumer Secret</Label>
            <Input
              id="consumer_secret"
              type="password"
              placeholder="Enter your Pesapal consumer secret"
              value={config.consumer_secret}
              onChange={(e) => 
                setConfig(prev => ({ ...prev, consumer_secret: e.target.value }))
              }
            />
            <Text size="small" className="text-ui-fg-subtle mt-1">
              Your Pesapal consumer secret (keep this secure)
            </Text>
          </div>

          {/* Currency */}
          <div>
            <Label htmlFor="currency">Default Currency</Label>
            <Select
              value={config.currency}
              onValueChange={(value) => 
                setConfig(prev => ({ ...prev, currency: value }))
              }
            >
              <Select.Trigger className="w-full">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="KES">KES - Kenyan Shilling</Select.Item>
                <Select.Item value="USD">USD - US Dollar</Select.Item>
                <Select.Item value="EUR">EUR - Euro</Select.Item>
                <Select.Item value="GBP">GBP - British Pound</Select.Item>
                <Select.Item value="UGX">UGX - Ugandan Shilling</Select.Item>
                <Select.Item value="TZS">TZS - Tanzanian Shilling</Select.Item>
              </Select.Content>
            </Select>
          </div>

          {/* Merchant Name */}
          <div>
            <Label htmlFor="merchant_name">Merchant Name</Label>
            <Input
              id="merchant_name"
              type="text"
              placeholder="Your business name"
              value={config.merchant_name}
              onChange={(e) => 
                setConfig(prev => ({ ...prev, merchant_name: e.target.value }))
              }
            />
            <Text size="small" className="text-ui-fg-subtle mt-1">
              Optional: Your business name for display purposes
            </Text>
          </div>

          {/* IPN URL */}
          <div className="md:col-span-2">
            <Label htmlFor="ipn_url">IPN Callback URL</Label>
            <Input
              id="ipn_url"
              type="url"
              placeholder="https://yourdomain.com/pesapal/webhook"
              value={config.ipn_url}
              onChange={(e) => 
                setConfig(prev => ({ ...prev, ipn_url: e.target.value }))
              }
            />
            <Text size="small" className="text-ui-fg-subtle mt-1">
              URL where Pesapal will send payment notifications. Leave empty to use default.
            </Text>
          </div>
        </div>

        {/* Sandbox Credentials Info */}
        {config.environment === "sandbox" && (
          <div className="mt-6 p-4 bg-ui-bg-subtle rounded-lg border">
            <Heading level="h3" className="mb-3">Sandbox Test Credentials</Heading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label>Consumer Key:</Label>
                <Text className="font-mono">qkio1BGGYAXTu2JOfm7XSXNruoZsrqEW</Text>
              </div>
              <div>
                <Label>Consumer Secret:</Label>
                <Text className="font-mono">osGQ364R49cXKeOYSpaOnT++rHs=</Text>
              </div>
            </div>
            <Text size="small" className="text-ui-fg-subtle mt-2">
              You can use these test credentials for Kenyan merchant sandbox testing
            </Text>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-8">
          <Button 
            variant="secondary" 
            onClick={handleTestConnection}
            disabled={!config.consumer_key || !config.consumer_secret || loading}
          >
            {loading ? "Testing..." : "Test Connection"}
          </Button>
          
          <Button 
            onClick={handleSave}
            disabled={!config.consumer_key || !config.consumer_secret || saving}
          >
            {saving ? "Saving..." : "Save Configuration"}
          </Button>
        </div>

        {/* Status Information */}
        <div className="mt-6 p-4 bg-ui-bg-base border rounded-lg">
          <Heading level="h3" className="mb-2">Status Information</Heading>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label>Provider Status:</Label>
              <Text className={config.enabled ? "text-green-600" : "text-red-600"}>
                {config.enabled ? "Enabled" : "Disabled"}
              </Text>
            </div>
            <div>
              <Label>Environment:</Label>
              <Text className={config.environment === "live" ? "text-orange-600" : "text-blue-600"}>
                {config.environment === "live" ? "Production" : "Sandbox"}
              </Text>
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.after",
})

export default PesapalConfigurationWidget 