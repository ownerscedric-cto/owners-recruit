import { NextRequest, NextResponse } from 'next/server'
import { getContactSettings, updateContactSettings } from '@/lib/contact-settings'

export async function GET(request: NextRequest) {
  try {
    const contactSettings = await getContactSettings()

    if (!contactSettings) {
      return NextResponse.json({
        success: false,
        error: 'Contact settings not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: contactSettings
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch contact settings'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone, description } = body

    if (!email || !phone || !description) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: email, phone, description'
      }, { status: 400 })
    }

    const success = await updateContactSettings({
      email,
      phone,
      description
    })

    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to update contact settings'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Contact settings updated successfully'
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to update contact settings'
    }, { status: 500 })
  }
}