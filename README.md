# React Chat App With Custom Commands and Webhooks

This full-stack tutorial shows you how to create a chat app using Stream's [React Chat SDK](https://getstream.io/chat/sdk/react/) and incorporating [Stream Webhooks](https://getstream.io/chat/docs/react/webhooks_overview/?language=javascript) to enable custom `/slash` commands. 

To show you how to create custom commands, you'll integrate Google Sign-In and retrieve events from a Google calendar with the command `/gcal`. 


## Getting Started
If you want to follow along, you'll need:
- A free [Google Cloud Platform](https://cloud.google.com/) account and [Stream](https://getstream.io/try-for-free/) account. 
- A free [Stream account](https://getstream.io/try-for-free/)
- A free [ngrok account](https://ngrok.com/)

## Quickstart 

To run this project locally: 

- Clone this repo: 

```bash
git clone https://github.com/ZPain8464/google-int-react-be.git
```

- Install dependencies 
```bash
npm i 
```

- Add your Stream API Key, Secret, and App ID to your `.env` file

- Add your Google Client ID, Secret, and Redirect URL to your `.env` file

- Run the following scripts to create your database: 
```bash 
$ sqlite3 database/proj.db
$ .read database/db.sql
```

- Create your webhook URL:
1. Go to your Stream dashboard
2. Select your app
3. Select **Chat** > **Overview** in your nav menu
4. Under **Realtime** in the **Webhook URL** field, enter your **ngrok** URL with `/auth/handlewebhook` (e.g. `https://XXX.ngrok.io/auth/handlewebhook`)
4. Click **Save**

- Under `setupcommands` in `controllers/auth.js`, update your `ngrokUrl` with the webhook url 
you specified in your Stream dashboard. 

You're ready to go! 