// Supabase Edge Function to generate Agora RTC tokens
// Deploy this to Supabase: supabase functions deploy generate-agora-token

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { RtcTokenBuilder, RtcRole } from 'npm:agora-access-token@2.0.4'

const AGORA_APP_ID = '4644112ab7454526badea7d34c7a1d59'
const AGORA_APP_CERTIFICATE = 'ce6ff9be80dc435d8e150bfeeb92e560'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { channelName, uid, role } = await req.json()

    // Validate inputs
    if (!channelName) {
      return new Response(
        JSON.stringify({ error: 'channelName is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Set token expiration time (1 hour from now)
    const expirationTimeInSeconds = 3600
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

    // Determine role (default to publisher)
    const agoraRole = role === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER

    // Convert uid to number (0 means Agora will assign a random UID)
    const numericUid = uid ? (typeof uid === 'number' ? uid : parseInt(uid, 10)) : 0

    // Generate token
    const token = RtcTokenBuilder.buildTokenWithUid(
      AGORA_APP_ID,
      AGORA_APP_CERTIFICATE,
      channelName,
      numericUid,
      agoraRole,
      privilegeExpiredTs,
      privilegeExpiredTs
    )

    console.log(`[Agora Token] Generated token for channel: ${channelName}, uid: ${numericUid}, role: ${agoraRole}`)

    return new Response(
      JSON.stringify({
        token,
        appId: AGORA_APP_ID,
        channelName,
        uid: numericUid,
        expiresIn: expirationTimeInSeconds
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error) {
    console.error('[Agora Token] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
