# GA4 Event Taxonomy — Veklom

Property: 537924036
Source: veklom-FRONTEND
Status: homepage funnel instrumentation

## Runtime contract

Google Analytics is loaded only through the existing consent-aware PrivacyRuntime.
Do not bypass the privacy gate, Global Privacy Control handling, or advertising-signal restrictions.
The deployment must provide NEXT_PUBLIC_GA_ID with the GA4 web stream measurement ID (G-...).

## Homepage events

| Event | Intent | Parameters |
| --- | --- | --- |
| `get_veklom_start` | User enters the Get Veklom path | cta_label, cta_location, destination |
| `vlink_connect_start` | User enters VLink connection flow | cta_label, cta_location, destination |
| `capability_os_open` | User opens Capability OS | cta_label, cta_location, destination |
| `proof_inspect` | User opens public proof | cta_label, cta_location, destination |
| `machine_surface_open` | User opens machine-facing surface | cta_label, cta_location, destination |

Current CTA locations:
- `home_hero`
- `home_vlink`
- `home_capability_os`

## GA4 Admin configuration

Recommended key events:
- `get_veklom_start`
- `vlink_connect_start`

Recommended event-scoped custom dimensions:
- `cta_label`
- `cta_location`
- `destination`

Do not mark ordinary navigation or proof inspection as a conversion unless the acquisition model changes.

## Next funnel layer

Homepage clicks are acquisition/intent signals, not proof of activation.
When the corresponding runtime milestones are instrumented, use separate events for:
- successful registration / identity activation
- VLink pairing accepted
- capability mounted / authority bound
- governed consequence observed
- receipt verified
- authority revoked / stale replay denied

Do not infer these lifecycle events from page views or CTA clicks.
