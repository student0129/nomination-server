const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { Resend } = require('resend'); // Make sure to run `npm install resend`

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Resend with the API key from your Render Environment Variables
const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// --- API Endpoints ---

// ✅ NEW: Root Endpoint (Status Check)
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'The Coterie Nomination API',
        message: 'This server is running and ready to receive POST requests at the /submit endpoint.'
    });
});

// 1. Wake-up Endpoint
app.get('/wake-up', (req, res) => {
    res.status(200).json({ message: 'Server is awake and ready.' });
});

// 2. Form Submission Endpoint
app.post('/submit', async (req, res) => {
    const { 
        nominationType, 
        name, 
        email, 
        title, 
        company, 
        linkedin, 
        community, 
        qualification, 
        nominatorName, 
        nominatorEmail 
    } = req.body;

    // --- Email Content Formatting ---
    let subject, htmlContent;
    
    if (nominationType === 'self') {
        subject = `New Coterie Nomination (Self): ${name}`;
        htmlContent = `
            <p style="font-family: Arial, sans-serif;">A new <strong>self-nomination</strong> has been submitted for The Coterie.</p>
            <h3 style="font-family: Arial, sans-serif;">Nominee Details:</h3>
            <ul style="font-family: Arial, sans-serif; line-height: 1.6;">
                <li><strong>Name:</strong> ${name}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Title:</strong> ${title}</li>
                <li><strong>Company:</strong> ${company}</li>
                <li><strong>LinkedIn:</strong> <a href="${linkedin}">${linkedin}</a></li>
                <li><strong>Community of Interest:</strong> ${community}</li>
            </ul>
            <h3 style="font-family: Arial, sans-serif;">Reason for Fit:</h3>
            <p style="font-family: Arial, sans-serif; white-space: pre-wrap;">${qualification}</p>
        `;
    } else { // Peer nomination
        subject = `New Coterie Nomination (Peer): ${name} by ${nominatorName}`;
        htmlContent = `
            <p style="font-family: Arial, sans-serif;">A new <strong>peer nomination</strong> has been submitted for The Coterie.</p>
            <h3 style="font-family: Arial, sans-serif;">Nominee Details:</h3>
            <ul style="font-family: Arial, sans-serif; line-height: 1.6;">
                <li><strong>Name:</strong> ${name}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Title:</strong> ${title}</li>
                <li><strong>Company:</strong> ${company}</li>
                <li><strong>LinkedIn:</strong> <a href="${linkedin}">${linkedin}</a></li>
                <li><strong>Community of Interest:</strong> ${community}</li>
            </ul>
            <h3 style="font-family: Arial, sans-serif;">Reason for Fit:</h3>
            <p style="font-family: Arial, sans-serif; white-space: pre-wrap;">${qualification}</p>
            <hr>
            <h3 style="font-family: Arial, sans-serif;">Nominator Details:</h3>
            <ul style="font-family: Arial, sans-serif; line-height: 1.6;">
                <li><strong>Name:</strong> ${nominatorName}</li>
                <li><strong>Email:</strong> ${nominatorEmail}</li>
            </ul>
        `;
    }

    // --- Send Email using Resend ---
    try {
        const { data, error } = await resend.emails.send({
            from: 'The Coterie <onboarding@resend.dev>', // This is a required default, but replies will go to your 'reply_to' address
            to: ['thecoterie@promontoryai.com'], // The email where you want to receive notifications
            reply_to: nominatorEmail || email, // Set the reply-to field correctly
            subject: subject,
            html: htmlContent
        });

        if (error) {
            console.error({ error });
            return res.status(400).json({ message: 'Error sending email.', error });
        }

        console.log('Email sent successfully via Resend:', data);
        res.status(200).json({ message: 'Nomination submitted successfully.' });

    } catch (e) {
        console.error('Server error:', e);
        res.status(500).json({ message: 'An internal server error occurred.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
