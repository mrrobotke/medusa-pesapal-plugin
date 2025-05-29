# Medusa Payment Pesapal

![npm version](https://img.shields.io/npm/v/medusa-payment-pesapal.svg)
![npm downloads](https://img.shields.io/npm/dm/medusa-payment-pesapal.svg)
![License](https://img.shields.io/npm/l/medusa-payment-pesapal.svg)

A Pesapal payment provider plugin for Medusa v2 that enables seamless integration with Pesapal's payment gateway, supporting popular East African payment methods including M-Pesa, Airtel Money, and more.

## Features

- 🔄 **Full Payment Lifecycle**: Support for authorization, capture, refunds, and cancellations
- 🌍 **Multi-Currency**: Support for KES, USD, EUR, GBP, UGX, TZS and more
- 📱 **East African Payment Methods**: M-Pesa, Airtel Money, Bank transfers, and credit cards
- 🔒 **Secure**: Industry-standard security practices with OAuth 2.0 authentication
- 🎛️ **Admin Dashboard**: Easy configuration and management through Medusa Admin
- 🔔 **Webhooks**: Real-time payment status updates via IPN (Instant Payment Notifications)
- 🧪 **Sandbox Support**: Full testing environment with provided test credentials
- 🌍 **East African Payment Methods**: Support for M-Pesa, Airtel Money, bank transfers, and card payments
- 🔒 **Secure Authentication**: OAuth 2.0 integration with Pesapal API v3
- 🎯 **Sandbox & Production**: Easy environment switching for testing and live payments
- 🎛️ **Admin Configuration**: Beautiful admin widget for easy setup and management
- 🔔 **Webhook Support**: Real-time payment status updates via IPN callbacks
- 💱 **Multi-Currency**: Support for KES, USD, EUR, GBP, UGX, TZS and more
- ⚡ **Modern Architecture**: Built specifically for Medusa v2 framework

## Installation

```bash
npm install medusa-payment-pesapal
# or
yarn add medusa-payment-pesapal
```

## Configuration

### 1. Add to medusa-config.ts

```typescript
import { defineConfig } from '@medusajs/framework/utils'

export default defineConfig({
  modules: [
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "medusa-payment-pesapal",
            id: "pesapal",
            options: {
              consumer_key: process.env.PESAPAL_CONSUMER_KEY,
              consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
              environment: process.env.PESAPAL_ENVIRONMENT || "sandbox",
              currency: process.env.PESAPAL_CURRENCY || "KES",
              merchant_name: process.env.PESAPAL_MERCHANT_NAME,
              ipn_url: process.env.PESAPAL_IPN_URL,
            }
          }
        ]
      }
    }
  ]
})
```

### 2. Environment Variables

Add these variables to your `.env` file:

```bash
# Pesapal Configuration
PESAPAL_CONSUMER_KEY=your_consumer_key
PESAPAL_CONSUMER_SECRET=your_consumer_secret
PESAPAL_ENVIRONMENT=sandbox # or 'live' for production
PESAPAL_CURRENCY=KES
PESAPAL_MERCHANT_NAME="Your Business Name"
PESAPAL_IPN_URL=https://yourdomain.com/pesapal/webhook
```

### 3. Sandbox Credentials (for testing)

For Kenyan merchants, you can use these test credentials:

```bash
PESAPAL_CONSUMER_KEY=qkio1BGGYAXTu2JOfm7XSXNruoZsrqEW
PESAPAL_CONSUMER_SECRET=osGQ364R49cXKeOYSpaOnT++rHs=
```

## Admin Configuration

After installation, you can configure Pesapal directly from the Medusa Admin:

1. Navigate to the Orders section in your admin panel
2. Look for the "Pesapal Configuration" widget
3. Fill in your credentials and settings
4. Test the connection
5. Enable the payment provider

## API Endpoints

The plugin automatically creates these endpoints:

- `GET /admin/custom/pesapal/config` - Get current configuration
- `POST /admin/custom/pesapal/config` - Save configuration
- `POST /admin/custom/pesapal/test` - Test connection
- `GET /store/pesapal/webhook` - Handle IPN callbacks
- `POST /store/pesapal/webhook` - Handle IPN callbacks

## Usage

### In Your Storefront

The payment provider will be automatically available in your checkout flow. Customers can select Pesapal as a payment method and will be redirected to Pesapal's secure payment page.

### Supported Payment Methods

- **M-Pesa** (Kenya, Tanzania)
- **Airtel Money** (Kenya, Uganda, Tanzania)
- **Bank Transfers** (Multiple banks across East Africa)
- **Credit/Debit Cards** (Visa, Mastercard)
- **Mobile Banking** (Equity, KCB, etc.)

### Currency Support

- KES (Kenyan Shilling)
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- UGX (Ugandan Shilling)
- TZS (Tanzanian Shilling)

## Development

### Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the plugin: `npm run build`
4. Link for local testing: `npm link`

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

## Webhook Configuration

For production use, configure your webhook URL in the Pesapal merchant dashboard:

1. Login to your Pesapal merchant account
2. Go to Settings > IPN Settings
3. Set your IPN URL to: `https://yourdomain.com/store/pesapal/webhook`
4. Select the events you want to receive notifications for

## Migration from v1

If you're migrating from Medusa v1, please note that this plugin is specifically designed for Medusa v2 and uses the new payment provider architecture.

## Support

- **Documentation**: [Pesapal API Documentation](https://developer.pesapal.com/)
- **Issues**: [GitHub Issues](https://github.com/mrrobotke/medusa-payment-pesapal/issues)
- **Community**: [Medusa Discord](https://discord.gg/medusajs)

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to help improve this plugin.

## License

MIT © [Antony Ngigge](https://iworldafric.com)

## Author

**Antony Ngigge** (Machomaniac)
- Website: [iWorldAfric](https://iworldafric.com)
- GitHub: [@mrrobotke](https://github.com/mrrobotke)
- Email: antonyngigge@gmail.com

---

Made with ❤️ for the East African e-commerce community
