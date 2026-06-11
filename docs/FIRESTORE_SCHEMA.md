# Firestore Database Schema v2.0

## Collections

### `users`
- `uid` (string) - Auth Reference
- `email` (string)
- `role` (string) - Admin, Manager, Editor
- `createdAt` (timestamp)

### `jobs`
- `jobId` (string, Document ID)
- `userId` (string)
- `keyword` (string)
- `status` (string) - pending | running | research | writing | pinterest | seo_clustering | completed | error
- `articleId` (string) - Ref
- `createdAt` (number)
- `updatedAt` (number)

### `articles`
- `articleId` (string, Document ID)
- `jobId` (string)
- `userId` (string)
- `title` (string)
- `content` (string)
- `keyword` (string)
- `externalLinks` (array)
- `wordpressStatus` (string) - pending | published | error
- `telegramStatus` (string) - pending | published | error

### `pins`
- `pinId` (string, Document ID)
- `articleId` (string)
- `jobId` (string)
- `userId` (string)
- `title` (string)
- `description` (string)
- `concept` (string)
- `imageUrl` (string)
- `telegramStatus` (string)

### `revenue_metrics`
- `id` (string, Document ID)
- `userId` (string)
- `jobId` (string)
- `keyword` (string)
- `clicks` (number)
- `conversions` (number)
- `revenue` (number)
- `epc` (number)
- `ctr` (number)
- `metricDate` (number)

### `offers`
- `id` (string, Document ID)
- `userId` (string)
- `name` (string)
- `network` (string)
- `payout` (number)
- `url` (string)
- `category` (string)
