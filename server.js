const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Nodemailer Configuration for Proton Mail SMTP Submission ---
const transporter = nodemailer.createTransport({
    host: 'smtp.protonmail.ch',
    port: 587,
    secure: false, // This must be false to use STARTTLS encryption
    auth: {
        user: process.env.PROTON_EMAIL, // Your full email address
        pass: process.env.PROTON_TOKEN  // The SMTP Submission TOKEN from Proton Mail
    }
});

// Verify transporter connection on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email transporter verification failed!', error);
    } else {
        console.log('✅ Email transporter is ready to send emails.');
    }
});

// --- API Endpoints ---

// Root Endpoint (Status Check)
app.get('/', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'The Coterie Nomination API',
        message: 'This server is running and ready to receive POST requests at the /submit endpoint.'
    });
});

// Wake-up Endpoint
app.get('/wake-up', (req, res) => {
    res.status(200).json({ message: 'Server is awake and ready.' });
});

// Form Submission Endpoint
app.post('/submit', async (req, res) => {
    const { 
        nominationType, name, email, title, company, linkedin, 
        community, qualification, nominatorName, nominatorEmail 
    } = req.body;

    // --- 1. Create Admin Notification Email ---
    let adminSubject, adminHtmlContent;
    if (nominationType === 'self') {
        adminSubject = `New Coterie Nomination (Self): ${name}`;
        adminHtmlContent = `
            <p>A new <strong>self-nomination</strong> has been submitted.</p>
            <h3>Nominee Details:</h3>
            <ul>
                <li><strong>Name:</strong> ${name}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Title:</strong> ${title}</li>
                <li><strong>Company:</strong> ${company}</li>
                <li><strong>LinkedIn:</strong> <a href="${linkedin}">${linkedin}</a></li>
                <li><strong>Community:</strong> ${community}</li>
            </ul>
            <h3>Reason for Fit:</h3>
            <p>${qualification}</p>
        `;
    } else {
        adminSubject = `New Coterie Nomination (Peer): ${name} by ${nominatorName}`;
        adminHtmlContent = `
            <p>A new <strong>peer nomination</strong> has been submitted.</p>
            <h3>Nominee Details:</h3>
            <ul>
                <li><strong>Name:</strong> ${name}</li>
                <li><strong>Email:</strong> ${email}</li>
                <li><strong>Title:</strong> ${title}</li>
                <li><strong>Company:</strong> ${company}</li>
                <li><strong>LinkedIn:</strong> <a href="${linkedin}">${linkedin}</a></li>
                <li><strong>Community:</strong> ${community}</li>
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

    const adminMailOptions = {
        from: `"The Coterie" <${process.env.PROTON_EMAIL}>`,
        to: process.env.PROTON_EMAIL, // Send the notification to yourself
        subject: adminSubject,
        html: adminHtmlContent
    };

    // --- 2. Create User Acknowledgment Emails ---
    const userEmailPromises = [];

    if (nominationType === 'self') {
        const selfNominatorOptions = {
            from: `"The Coterie" <${process.env.PROTON_EMAIL}>`,
            to: email,
            subject: 'Your Nomination for The Coterie',
            html: `
                <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #002FA7;">Thank You, ${name}.</h2>
                    <p>We have received your nomination for The Coterie, the exclusive peer circle for senior leaders in AI and analytics.</p>
                    <p>The Coterie is a curated community where every member is chosen for the perspective they contribute and the value they receive. Your submission is the first step in our vetting process.</p>
                    <p><b>Next Steps:</b> Our team will carefully review your nomination. We will be in touch within two business weeks regarding the status of your application.</p>
                    <p>Thank you for your interest in joining a community dedicated to navigating what's next.</p>
                    <p>Sincerely,<br>The Coterie by Promontory AI</p>
                </div>
            `
        };
        userEmailPromises.push(transporter.sendMail(selfNominatorOptions));
    } else if (nominationType === 'peer') {
        // Email to the Nominator
        const nominatorOptions = {
            from: `"The Coterie" <${process.env.PROTON_EMAIL}>`,
            to: nominatorEmail,
            subject: `Thank you for nominating ${name} for The Coterie`,
            html: `
                <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #002FA7;">Thank you for your contribution, ${nominatorName}.</h2>
                    <p>Your nomination of <strong>${name}</strong> for The Coterie has been received. Identifying leaders at the forefront of AI and analytics is essential to building this community, and we appreciate your input.</p>
                    <p><b>Next Steps:</b> We will now review the nomination and reach out to ${name} to begin the vetting process.</p>
                    <p>Your role in shaping this peer circle is valued.</p>
                    <p>Sincerely,<br>The Coterie by Promontory AI</p>
                </div>
            `
        };
        userEmailPromises.push(transporter.sendMail(nominatorOptions));

        // Email to the Nominee
        const nomineeOptions = {
            from: `"The Coterie" <${process.env.PROTON_EMAIL}>`,
            to: email,
            subject: 'A Nomination to Join The Coterie',
            html: `
                 <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #002FA7;">An Invitation from a Peer.</h2>
                    <p>Hello ${name},</p>
                    <p>You have been nominated by <strong>${nominatorName}</strong> to join <strong>The Coterie</strong>—an exclusive, invite-only peer circle for senior AI and analytics leaders in the Washington D.C. Metro Area.</p>
                    <p>The Coterie is where leaders gather to transform individual challenges into collective wisdom and navigate what's next. This nomination recognizes your influence and perspective in the field.</p>
                    <p><b>Next Steps:</b> There is nothing you need to do at this time. Our team will be in touch shortly with more details about the community and the vetting process.</p>
                    <p>Sincerely,<br>The Coterie by Promontory AI</p>
                </div>
            `
        };
        userEmailPromises.push(transporter.sendMail(nomineeOptions));
    }

    // --- 3. Send All Emails ---
    try {
        // Send all emails concurrently: the admin notification and any user acknowledgments.
        await Promise.all([
            transporter.sendMail(adminMailOptions),
            ...userEmailPromises
        ]);
        
        console.log('All emails sent successfully.');
        res.status(200).json({ message: 'Nomination submitted successfully.' });
    } catch (error) {
        console.error('Error sending one or more emails:', error);
        res.status(500).json({ message: 'Error processing your nomination.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
