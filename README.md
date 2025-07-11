# n8n-nodes-evaboot

This is an n8n community node that lets you use [Evaboot](https://evaboot.com) in your n8n workflows.

Evaboot is a powerful lead generation platform that helps you find, validate, and extract professional contact information from LinkedIn and other sources.

## 🚀 Features

- **Email Finding**: Discover professional email addresses using first name, last name, and company information
- **Email Validation**: Verify the deliverability and validity of email addresses  
- **LinkedIn Extraction**: Extract profiles and contact information from LinkedIn Sales Navigator searches
- **Asynchronous Processing**: Handle long-running jobs with webhooks, polling, or wait mechanisms
- **Real-time Status Tracking**: Monitor job progress and completion status

## 📦 Installation

### Via n8n Community Nodes (Recommended)
1. Go to **Settings > Community Nodes** in your n8n instance
2. Click **Install a Community Node**
3. Enter `n8n-nodes-evaboot`
4. Click **Install**

### Manual Installation
```bash
npm install n8n-nodes-evaboot
```

## 🔧 Configuration

1. Get your API key from [Evaboot Settings](https://app.evaboot.com/settings)
2. In n8n, create a new **Evaboot API** credential
3. Enter your API token

## 🛠️ Available Nodes

- **Evaboot**: Main operations for email finding, validation, and LinkedIn extractions
- **Evaboot Trigger**: Webhook triggers for job completion
- **Evaboot Polling**: Scheduled polling for job completion
- **Evaboot Wait**: Wait for job completion in workflows

## 📚 Documentation

For detailed usage instructions, see [DOCUMENTATION.md](DOCUMENTATION.md)

## 🔗 Resources

- [Evaboot Website](https://evaboot.com)
- [Evaboot API Documentation](https://api.evaboot.com/v1/docs/)
- [n8n Community](https://community.n8n.io)

## 📄 License

[MIT](https://github.com/evaboot-team/n8n-nodes-evaboot/blob/main/LICENSE.md)

---

Built with ❤️ by the Evaboot team for the n8n community.