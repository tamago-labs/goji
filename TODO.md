# TODO — v1 Features

## 1. Multi-sig Gate

Gate cards require M-of-N signatures from different wallets before payment proceeds.

- [ ] Gate card schema: `required` (M), `total` (N), `signers` (list of wallet addresses)
- [ ] Gate card UI: show signer slots, collected signatures count
- [ ] CanvasCard: display M-of-N badge on gate card
- [ ] Flow execution: pause at gate until M signatures collected
- [ ] Signature collection: each signer signs via their wallet
- [ ] P2P sync: gate status (who signed, who hasn't)
- [ ] ConnectionDrawer: configure gate signers

## 2. Deposit Flow

Allow users to deposit USDC into unified balance before spending.

- [ ] DepositSpendModal: deposit tab already works, verify end-to-end
- [ ] Show deposit status in overlay panel
- [ ] Auto-deposit prompt when balance insufficient for payment
- [ ] Deposit history in user menu popover

## 3. Recipient Mode

New mode for recipients to view payslips/documents without seeing payment flow.

- [ ] Recipient view: read-only mode showing received documents
- [ ] Share link: `/recipient/{flowId}/{connectionId}` — view-only payslip
- [ ] Recipient can download/view payslip HTML
- [ ] No canvas access — just document viewer
- [ ] Schema: add `recipientView` flag to connection

## 4. Transaction History Export

Export payment history as CSV or PDF.

- [ ] Export button on History tab
- [ ] CSV export: date, from, to, amount, chain, txHash, status
- [ ] PDF export: rendered payslip template per transaction
- [ ] Date range filter for export
- [ ] Bulk export: select multiple transactions

## 5. Batch Payments

Upload CSV to create multiple recipients at once.

- [ ] CSV parser: parse recipient name, address, amount, chain
- [ ] Import modal: preview parsed data before creating
- [ ] Auto-create recipient cards on canvas
- [ ] Auto-connect to source wallet
- [ ] CSV template download for users
- [ ] Validation: check addresses, amounts, chains
