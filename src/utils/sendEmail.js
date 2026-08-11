const { SendEmailCommand } = require("@aws-sdk/client-ses");
const { sesClient } = require("./sesClient.js");

const sendEmail = async (toEmail, subject, body) => {

    const command = new SendEmailCommand({
        Destination: {
            ToAddresses: [toEmail],
        },

        Message: {
            Subject: {
                Charset: "UTF-8",
                Data: subject,
            },

            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: `
                        <h2>Password Reset</h2>
                        <p>You requested to reset your TalentLink password.</p>
                        <p>Click the button below to reset your password:</p>

                        <a href="${body}">
                            Reset Password
                        </a>

                        <p>This link will expire in 10 minutes.</p>

                        <p>If you did not request a password reset, you can ignore this email.</p>
                    `,
                },

                Text: {
                    Charset: "UTF-8",
                    Data: `You requested to reset your TalentLink password.

Reset your password using this link:
${body}

This link will expire in 10 minutes.

If you did not request a password reset, you can ignore this email.`,
                },
            },
        },

        Source: "noreply@talentlink.in",
    });

    try {
        const response = await sesClient.send(command);

        console.log("Email sent successfully:", response.MessageId);

        return response;

    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

module.exports = { sendEmail };