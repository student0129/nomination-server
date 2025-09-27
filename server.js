const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config(); // For local development with a .env file

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Nodemailer Configuration for Proton Mail ---
// This configuration requires the Proton Mail Bridge to be active.
// This will likely fail on a cloud service like Render which cannot run the Bridge.
const transporter = nodemailer.createTransport({
    host: 'smtp.protonmail.ch', // Proton Mail SMTP server
    port: 587,                  // Standard SMTP port
    secure: false,              // Use STARTTLS
    auth: {
        user: process.env.EMAIL_USER, // Your Proton Mail email address
        pass: process.env.EMAIL_PASS  // Your Proton Mail Bridge password
    },
    tls: {
        rejectUnauthorized: false 
    }
});

// Verify transporter connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email transporter verification failed. This is expected on cloud platforms without Proton Mail Bridge.', error);
    } else {
        console.log('✅ Email transporter is ready to send emails.');
    }
});


// --- API Endpoints ---

// 1. Wake-up Endpoint
app.get('/wake-up', (req, res) => {
    res.status(200).json({ message: 'Server is awake and ready.' });
});

// 2. Form Submission Endpoint
app.post('/submit', (req, res) => {
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

    // Basic validation
    if (!name || !email || !title || !company || !linkedin || !community || !qualification) {
        return res.status(400).json({ message: 'Missing required fields for the nominee.' });
    }
    if (nominationType === 'peer' && (!nominatorName || !nominatorEmail)) {
        return res.status(400).json({ message: 'Missing required fields for the nominator.' });
    }


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
            <p style="font-family: Arial,.sans-serif; white-space: pre-wrap;">${qualification}</p>
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

    const mailOptions = {
        from: `"The Coterie" <${process.env.EMAIL_USER}>`,
        to: 'thecoterie@promontoryai.com',
        subject: subject,
        html: htmlContent
    };

    // --- Send Email ---
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ message: 'Error processing your nomination. Please try again later.' });
        }
        console.log('Email sent:', info.response);
        res.status(200).json({ message: 'Nomination submitted successfully.' });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
