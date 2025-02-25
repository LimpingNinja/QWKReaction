# Running the QWK Mail Reader

## Setup Instructions

1. Create a new React project:

```bash
npx create-react-app qwk-reader
cd qwk-reader
```

2. Replace the default files with the ones provided in these artifacts:

- Copy all the files to their respective locations as shown in the project structure
- Make sure to create the necessary directories (`src/lib`, `src/components`, `src/components/ui`)

3. Install the dependencies:

```bash
npm install @radix-ui/react-slot class-variance-authority clsx lucide-react tailwind-merge tailwindcss-animate
npm install -D tailwindcss postcss autoprefixer
```

4. Run the application:

```bash
npm start
```

## About QWK Files

QWK files are an offline message packet format that was popular in the BBS era (1980s-1990s). A QWK packet typically consists of:

1. `CONTROL.DAT` - Contains BBS information and conference listings
2. `MESSAGES.DAT` - Contains the actual message data in a binary format
3. Optional additional files like welcome screens or bulletins

## Testing the Application

Since actual QWK mail packets are now quite rare, you have two options for testing:

1. Find QWK archives on BBS archive sites
2. Create sample QWK files for testing purposes

### Creating Sample QWK Files for Testing

To create a simple test file:

1. Create a text file named `CONTROL.DAT` with contents similar to the example provided
2. For `MESSAGES.DAT`, you'd need to create a binary file with the proper structure (this is more challenging and would require a utility)

### Using Existing BBS Archives

Some BBS archives like archive.org may have QWK packets available for download.

## Features of the QWK Reader

- View conferences and message threads
- Read messages in a threaded format
- View message metadata (sender, recipient, dates)
- Support for CP437 character encoding used in BBS systems

## Notes on Implementation

- This reader implements standard QWK format conventions, including thread linking based on message reply IDs
- The CP437 character set is properly converted to Unicode
- The interface supports both compact and expanded view modes

Enjoy your trip back to the BBS era!
