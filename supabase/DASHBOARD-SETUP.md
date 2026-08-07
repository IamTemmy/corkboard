# Supabase dashboard setup (the parts that aren't in SQL)

Most of the auth backend is in [`auth-and-profiles.sql`](./auth-and-profiles.sql).
But a few things live only in the Supabase dashboard — they can't be expressed as
SQL. This file records them so the setup is reproducible and nothing is lost.
**No secrets are stored here** (the Resend API key lives only in Supabase).

## 1. Before-user-created auth hook

Authentication → **Auth Hooks** → add a **"Before User Created"** hook →
type **Postgres**, schema `public`, function
`hook_restrict_signup_by_email_domain` (created by the SQL file). This is what
rejects non-approved email domains.

## 2. Custom SMTP (Resend) — so auth emails send + templates unlock

Supabase's built-in email locks template editing, so we deliver auth email
through Resend (Resend is *only* the delivery pipe — Supabase still owns auth
and OTP).

Authentication → Emails → **SMTP Settings** → Enable custom SMTP:

| Field        | Value                                  |
| ------------ | -------------------------------------- |
| Host         | `smtp.resend.com`                      |
| Port         | `465` (fallback `587`)                 |
| Username     | `resend`                               |
| Password     | *Resend API key* (never commit it)     |
| Sender email | `onboarding@resend.dev` (sandbox)      |
| Sender name  | `Corkboard`                            |

**Free-tier limit:** the `onboarding@resend.dev` sandbox sender only delivers to
the email the Resend account was created with. To email *any* student (i.e. real
launch), verify a domain you own in Resend and change Sender email to an address
at that domain.

## 3. Email OTP length

Authentication → Sign In / Providers → **Email** → **Email OTP Length** = `6`.
(The default produced 8-digit codes, which didn't match the 6-digit UI/template.)

## 4. OTP email template

Authentication → Emails → **Magic Link / OTP** template ("Your sign-in link") →
**Source** → paste the body below. `{{ .Token }}` renders the 6-digit code.

```html
<h2>Sign in to Corkboard</h2>
<p>Enter this 6-digit code to finish signing in:</p>
<p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:16px 0;">
  {{ .Token }}
</p>
<p style="color:#666;font-size:13px;">
  This code expires shortly. If you didn't request it, you can ignore this email.
</p>
```
