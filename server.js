const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow requests from your frontend
app.use(express.json()); // Parse JSON bodies

// --- Nodemailer Configuration ---
// IMPORTANT: Use environment variables in a real-world scenario (process.env.EMAIL_USER, process.env.EMAIL_PASS)
// For Render, you will set these in the 'Environment' tab of your service.
const transporter = nodemailer.createTransport({
    service: 'gmail', // Or another email service like SendGrid, etc.
    auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS  // Your email password or app-specific password
    }
});

// --- API Endpoints ---

// 1. Wake-up Endpoint
// The frontend will call this on page load to spin up the server from sleep.
app.get('/wake-up', (req, res) => {
    res.status(200).send({ message: 'Server is awake and ready.' });
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

    // --- Email Content Formatting ---
    let subject, htmlContent;

    if (nominationType === 'self') {
        subject = `New Coterie Nomination (Self): ${name}`;
        htmlContent = `
            <p>A new <strong>self-nomination</strong> has been submitted for The Coterie.</p>
            <h3>Nominee Details:</h3>
            <ul>
                <li><strong>Name:</strong> ${name}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Title:</strong> ${title}</li>
                <li><strong>Company:</strong> ${company}</li>
                <li><strong>LinkedIn:</strong> <a href="${linkedin}">${linkedin}</a></li>
                <li><strong>Community of Interest:</strong> ${community}</li>
            </ul>
            <h3>Reason for Fit:</h3>
            <p>${qualification}</p>
        `;
    } else { // Peer nomination
        subject = `New Coterie Nomination (Peer): ${name} by ${nominatorName}`;
        htmlContent = `
            <p>A new <strong>peer nomination</strong> has been submitted for The Coterie.</p>
            <h3>Nominee Details:</h3>
            <ul>
                <li><strong>Name:</strong> ${name}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Title:</strong> ${title}</li>
                <li><strong>Company:</strong> ${company}</li>
                <li><strong>LinkedIn:</strong> <a href="${linkedin}">${linkedin}</a></li>
                <li><strong>Community of Interest:</strong> ${community}</li>
            </ul>
            <h3>Reason for Fit:</h3>
            <p>${qualification}</p>
            <hr>
            <h3>Nominator Details:</h3>
            <ul>
                <li><strong>Name:</strong> ${nominatorName}</li>
                <li><strong>Email:</strong> ${nominatorEmail}</li>
            </ul>
        `;
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: 'thecoterie@promontoryai.com',
        subject: subject,
        html: htmlContent
    };

    // --- Send Email ---
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).send({ message: 'Error processing your nomination. Please try again later.' });
        }
        console.log('Email sent:', info.response);
        res.status(200).send({ message: 'Nomination submitted successfully.' });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
