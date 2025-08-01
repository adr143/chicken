from flask import Flask, request, jsonify
from flask_mail import Mail, Message

app = Flask(__name__)

# Configure Flask-Mail
app.config['MAIL_SERVER'] = 'smtp.gmail.com'  # Use your SMTP server
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = 'aguamulak00@gmail.com'  # Your email
app.config['MAIL_PASSWORD'] = 'fnea xbqy wast cwkl'  # App password
app.config['MAIL_DEFAULT_SENDER'] = 'aguamulak00@gmail.com'  # Default sender

mail = Mail(app)

@app.route('/send_mail')
def send_mail():
    recipient = "aguamulak00@gmail.com"

    subject = "Test Email from Flask"
    body = "This is a test email sent from Flask using Flask-Mail."

    if not recipient:
        return jsonify({'error': 'Recipient is required'}), 400

    msg = Message(subject=subject,
                  recipients=[recipient],
                  body=body)

    try:
        mail.send(msg)
        return jsonify({'message': 'Email sent successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
