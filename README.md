# EVE Metro

Pochven region mapping service for [EVE Online](https://eveonline.com) (by CCP games). Service is available at https://evemetro.com. It is a subscription based service where all the in game currency (ISK) is pooled and divided to pilots scanning and mapping connections to provide a highway to all users.

# Current team:
- [Kybernauts](https://evewho.com/corporation/98644650) hosting and management
- [Kylon Olgidar](https://evewho.com/character/2115520405) day to day operations
- [Calli](https://evewho.com/character/1213492161) development

## EVE Metro api

API is available and code for it resides in [eve-metro-api repository](https://github.com/calli-eve/eve-metro-api). Contact the team for access.

## Cron Endpoints

Configure your cron job to call this endpoint every 30 minutes.

### `/api/cron/purge-connections`

Automated endpoint that handles cleanup of expired Triglavian connections in the system. This endpoint:
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
- `NEXT_PUBLIC_DOMAIN` - Your application domain (e.g., http://evemetro.com or http://localhost)
  > Note: include the port if you're running a development server
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

## Development

### Prerequisites
Before you start, ensure you have the following installed:
- **Node.js** (version 14 or higher)
- **Docker** and **Docker Compose**
- **Git**

### Getting Started

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/eve-metro.git
   cd eve-metro
   ```

2. **Set Up Environment Variables**
   Copy the example environment file and configure it:
   ```bash
   cp env.example .env
   ```
   Edit the `.env` file to fill in the required values. Set POSTGRES_HOST to localhost. Remember to set your character IDs in ADMIN_CHARACTER_IDS.

3. **Download and Set Up the EVE SDE**
   Create a directory for the EVE Static Data Export (SDE) and download the latest version:
   ```bash
   mkdir sde
   wget https://www.fuzzwork.co.uk/dump/sqlite-latest.sqlite.bz2
   bzip2 -d sqlite-latest.sqlite.bz2
   mv sqlite-latest.sqlite sde/
   ```

4. **Start the Development Database**
   Use Docker Compose to start the necessary services:
   ```bash
   docker compose -f docker-compose-dev.yml up -d
   ```
   This will start the PostgreSQL database and any other services defined in `docker-compose.yml`.

5. **Install Dependencies**
   Install the required Node.js packages:
   ```bash
   npm install
   ```
6. **Run the knex migrations**
   ```bash
   npm run knex-migrate
   ```
   This will start the PostgreSQL database and any other services defined in `docker-compose.yml`.

7. **Run the Development Server**
   Start the application in development mode:
   ```bash
   npm run dev
   ```
   The application should now be accessible at `http://localhost:3000`.

8. **Login to the Admin Panel and setup wallet watcher and email bot**
   After EVEMetro is running you need to login to the admin panel and setup the wallet watcher and email bot characters.
   Wallet watcher character should be a character that has access to corporation wallet.
   Email bot character should be a character that you want to be the one sending out emails in game.

9. **CRON JOBS**
   The application has 3 cron jobs that need to be setup.
   - Wallet watcher cron job
   - Email bot cron job
   - Allowed entities cron job

   During development you can also simulate the cron jobs by calling the endpoints directly:
   ```bash
   curl http://localhost:3000/api/cron/create-allowed-entities
   ```
      ```bash
   curl http://localhost:3000/api/cron/purge-allowed-entities
   ```
      ```bash
   curl http://localhost:3000/api/cron/purge-connections
   ```


### Development Commands
- **Start Development Server**: `npm run dev`
- **Build Production Version**: `npm run build`
- **Start Production Server**: `npm run start`
- **Run Linting**: `npm run lint`
- **Run Tests**: `npm run test`

### Contributing
If you want to contribute to the project:
1. **Create a new branch** for your feature or bug fix:
   ```bash
   git checkout -b feature/my-feature
   ```
2. **Make your changes** and commit them:
   ```bash
   git commit -m "Add my feature"
   ```
3. **Push your changes** to your fork:
   ```bash
   git push origin feature/my-feature
   ```
4. **Create a Pull Request** to the main repository.

### Additional Resources
- [EVE Online Developer Portal](https://developers.eveonline.com/)
- [Docker Documentation](https://docs.docker.com/)
- [Node.js Documentation](https://nodejs.org/en/docs/)
