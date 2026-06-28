# Implement Notion Task

Implement a task from the Notion board by its name, track progress in Notion, and mark it done when complete.

## Steps

Follow these steps exactly, in order:

### 1. Find the task on Notion

Search the Notion database for a page whose title matches `$ARGUMENTS` (case-insensitive, partial match is fine):

```powershell
$headers = @{ "Authorization" = "Bearer $env:NOTION_TOKEN"; "Notion-Version" = "2022-06-28"; "Content-Type" = "application/json" }
$body = @{
  filter = @{ property = "Name"; title = @{ contains = "$ARGUMENTS" } }
} | ConvertTo-Json -Depth 5
$res = Invoke-RestMethod -Uri "https://api.notion.com/v1/databases/$env:NOTION_DB_ID/query" -Method Post -Headers $headers -Body $body
$res.results | Select-Object id, @{n="title";e={$_.properties.Name.title[0].plain_text}}, @{n="status";e={$_.properties.Status.status.name}}
```

If no match is found, tell the user and stop. If multiple match, list them and ask which one to proceed with.

### 2. Fetch the task description from the page body

Read the page's block children to get the full user story and any acceptance criteria:

```powershell
$pageId = "<id from step 1>"
$blocks = Invoke-RestMethod -Uri "https://api.notion.com/v1/blocks/$pageId/children" -Headers $headers
$blocks.results | ForEach-Object {
  $type = $_.type
  if ($type -eq "paragraph") { $_.paragraph.rich_text.plain_text -join "" }
  elseif ($type -eq "to_do") { "[$(if($_.to_do.checked){'x'}else{' '})] $($_.to_do.rich_text.plain_text -join '')" }
  elseif ($type -in "heading_1","heading_2","heading_3") { $_.($type).rich_text.plain_text -join "" }
  elseif ($type -eq "bulleted_list_item") { "- $($_.bulleted_list_item.rich_text.plain_text -join '')" }
}
```

Read and understand:
- The **user story** (the "As a..." paragraph)
- Any **acceptance criteria** (to_do checklist blocks, if present)

### 3. Set task status to "In progress"

```powershell
$body = @{ properties = @{ Status = @{ status = @{ name = "In progress" } } } } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri "https://api.notion.com/v1/pages/$pageId" -Method Patch -Headers $headers -Body $body | Out-Null
```

### 4. Implement the feature

Use the user story and acceptance criteria as your specification. Follow the existing project conventions:

- Backend routes live in `backend/routes/posts.js`
- Frontend API calls live in `frontend/src/api/posts.js`
- Pages live in `frontend/src/pages/`, each paired with a `.module.css`
- Data model: `id`, `title`, `content`, `author`, `category`, `status`, `created_at` in SQLite

Implement fully — both backend and frontend where applicable.

### 5. Check off acceptance criteria in Notion (if any)

For each `to_do` block found in step 2, mark it checked after implementing the corresponding item:

```powershell
$blockId = "<block id>"
$body = @{ to_do = @{ checked = $true; rich_text = @(@{ type = "text"; text = @{ content = "<original text>" } }) } } | ConvertTo-Json -Depth 6
Invoke-RestMethod -Uri "https://api.notion.com/v1/blocks/$blockId" -Method Patch -Headers $headers -Body $body | Out-Null
```

### 6. Set task status to "Done"

```powershell
$body = @{ properties = @{ Status = @{ status = @{ name = "Done" } } } } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri "https://api.notion.com/v1/pages/$pageId" -Method Patch -Headers $headers -Body $body | Out-Null
```

### 7. Report completion

Tell the user what was implemented and confirm the Notion task is now marked Done.
