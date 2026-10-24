# Sentinel Personal Defense - Data Minimization

Sentinel should collect the minimum data necessary to identify compromise patterns.

Allowed examples: package names, install source, permission/security-state metadata, timestamps, owner-provided transaction descriptors, tokenized account reference/last four, security-alert metadata, IP/device identifiers legitimately exposed to the owner.

Never collect: passwords, PINs, CVVs, MFA secrets/recovery codes, authentication cookies, private content from unrelated apps, or full payment-card/account numbers when a tokenized reference is sufficient.

Customer evidence belongs to the customer. Product workflows must support export and deletion.