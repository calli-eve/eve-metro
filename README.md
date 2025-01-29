EVE Metro


## Cron Endpoints

Configure your cron job to call this endpoint every 30 minutes.

### `/api/cron/purge-connections`

Automated endpoint that handles cleanup of expired triglavian connections in the system. This endpoint:
- Removes stale/expired connections from the database
- Should be called periodically to maintain data freshness
- Helps maintain accurate pathfinding by removing outdated connection data

### `/api/cron/create-allowed-entities`

Automated endpoint that manages the creation of allowed entities in the system. This endpoint:
- Creates new entity allowlist entries
- Should be called periodically to maintain access control
- Helps manage which entities have access to specific features

### `/api/cron/purge-allowed-entities`

Automated endpoint that handles cleanup of allowed entities. This endpoint:
- Removes outdated or invalid entity allowlist entries
- Should be called periodically to maintain clean access control lists
- Helps ensure only currently valid entities maintain access

## EVE Static Data Export (SDE)

The application requires the EVE Online Static Data Export to function. This contains essential information about EVE Online's universe structure.

### Setup

1. Download the latest SDE from [Fuzzwork sqlite conversion](https://www.fuzzwork.co.uk/dump/sqlite-latest.sqlite.bz2)
2. Extract the SDE to your configured `SDE_PATH`
3. Ensure the application has read access to this directory

### Updating
The SDE should be updated when CCP releases new versions, typically after major game updates that change universe structure.

## Environment Variables

### EVE Online Integration
- `NEXT_PUBLIC_DOMAIN` - Your application domain (e.g., evemetro.com)
- `NEXT_PUBLIC_EVE_SSO_AUTH_HOST` - EVE SSO authentication host (default: https://login.eveonline.com)
- `NEXT_PUBLIC_EVE_IMAGES_API_HOST` - EVE images API host (default: https://images.evetech.net)
- `NEXT_PUBLIC_EVE_ESI_HOST` - EVE ESI API host (default: https://esi.evetech.net/latest)
- `NEXT_PUBLIC_EVE_SSO_ID` - Your EVE Online SSO client ID from the developer portal
- `EVE_SSO_SECRET` - Your EVE Online SSO secret key from the developer portal

### Development Settings
- `ENVIRONMENT` - Set to 'development' to block EVEMail spam during development
- `SDE_PATH` - Path to EVE Static Data Export Fuzzwork sqlite conversion on host system

### Database Configuration
- `POSTGRES_USER` - PostgreSQL username
- `POSTGRES_PASSWORD` - PostgreSQL password
- `POSTGRES_DB` - PostgreSQL database name
- `POSTGRES_HOST` - PostgreSQL host address (postgres when running with docker compose)
- `EVE_METRO_DATABASE` - Application database name (default: evemetro)

### Security
- `COOKIE_CRYPT_KEY` - Random string used to encrypt EVE SSO session in cookies
- `ADMIN_CHARACTER_IDS` - JSON array of character IDs that can access admin tools

### External APIs
- `EVE_SCOUT_API_URL` - EVE Scout API endpoint (default: https://api.eve-scout.com/v2/public/signatures)


