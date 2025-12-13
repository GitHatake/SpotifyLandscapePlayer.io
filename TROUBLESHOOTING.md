# Deployment Troubleshooting

If you see a **404 error** when accessing the site, it likely means GitHub Pages is not yet configured to serve from the `gh-pages` branch.

## Solution: Enable GitHub Pages

1.  Go to your GitHub repository > **Settings**.
2.  Select **Pages** from the left sidebar.
3.  Under **Build and deployment**:
    *   **Source**: Select `Deploy from a branch`.
    *   **Branch**: Select `gh-pages` and `/ (root)`.
4.  Click **Save**.

Wait a minute or two, then refresh the site.
