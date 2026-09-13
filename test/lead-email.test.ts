import test from 'node:test'
import assert from 'node:assert/strict'
import { NextRequest } from 'next/server'
test('provider acceptance, partial email failure and idempotent retry report truthful receipts',async(t)=>{
  process.env.VERCEL='1'; process.env.LEADS_STORAGE_MODE=''; process.env.LEADS_WEBHOOK_URL=''
  process.env.RESEND_API_KEY='test-only-never-sent'; process.env.LEAD_NOTIFICATION_EMAIL='operator@example.com'
  const original=globalThis.fetch
  let failCustomer=false
  const calls:any[]=[]
  globalThis.fetch=async(_url,options)=>{
    const body=JSON.parse(String(options?.body)); calls.push(body)
    return new Response('{}',{status:failCustomer && body.to==='customer@example.com' ? 503 : 200})
  }
  t.after(()=>{globalThis.fetch=original})
  const {POST}=await import('../app/api/leads/route')
  const request=(key:string)=>new NextRequest('https://www.qbccinsurancecalculator.com.au/api/leads',{method:'POST',headers:{'content-type':'application/json','idempotency-key':key},body:JSON.stringify({source:'post-calculation',email:'customer@example.com',workType:'new-construction',insurableValue:165000,units:1,premium:1,qleave:1})})
  const first=await POST(request('controlled-email-test-01')); assert.equal(first.status,200)
  const sent=await first.json(); assert.equal(sent.data.deliveryStatus,'sent')
  assert.ok(calls[1].html.includes('$1,809.10'))
  const repeated=await (await POST(request('controlled-email-test-01'))).json()
  assert.equal(repeated.data.leadReference,sent.data.leadReference);assert.equal(calls.length,2)
  failCustomer=true
  const partial=await POST(request('controlled-email-test-02')); assert.equal(partial.status,200)
  assert.equal((await partial.json()).data.deliveryStatus,'saved')
})
