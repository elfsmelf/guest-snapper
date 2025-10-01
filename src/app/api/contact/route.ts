import { NextRequest, NextResponse } from 'next/server'
import { sendContactForm } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, message, recaptchaToken } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      )
    }

    // Verify reCAPTCHA token
    if (!recaptchaToken) {
      return NextResponse.json(
        { error: 'reCAPTCHA verification required' },
        { status: 400 }
      )
    }

    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY
    if (!recaptchaSecret) {
      console.error('RECAPTCHA_SECRET_KEY not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Verify reCAPTCHA with Google
    const recaptchaResponse = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${recaptchaSecret}&response=${recaptchaToken}`,
      }
    )

    const recaptchaData = await recaptchaResponse.json()

    if (!recaptchaData.success || recaptchaData.score < 0.5) {
      console.error('reCAPTCHA verification failed:', recaptchaData)
      return NextResponse.json(
        { error: 'reCAPTCHA verification failed' },
        { status: 400 }
      )
    }

    // Send email
    await sendContactForm({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    })

    return NextResponse.json({
      success: true,
      message: 'Your message has been sent successfully',
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    )
  }
}
