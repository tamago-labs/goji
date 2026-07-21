import FlowBuilder from '../../components/flow/FlowBuilder'
import { type FlowCard, type Connection } from '../../components/flow/types'

function getInitialData(type: string | null): {
  cards: FlowCard[]
  connections: Connection[]
  name: string
} {
  if (type === 'simple-payroll') {
    const wallet: FlowCard = {
      id: 'card-1',
      category: 'wallet',
      title: 'Ops Multisig',
      x: 100,
      y: 200,
      fields: { address: '0x4F...9C1', balance: '18400' }
    }
    const r1: FlowCard = {
      id: 'card-2',
      category: 'recipient',
      title: 'alix.eth',
      x: 500,
      y: 80,
      fields: { address: 'alix.eth', amount: '4200', doc: 'q3-alix.pdf' }
    }
    const r2: FlowCard = {
      id: 'card-3',
      category: 'recipient',
      title: '0x88...2b',
      x: 500,
      y: 220,
      fields: { address: '0x88...2b', amount: '2800', doc: '' }
    }
    const r3: FlowCard = {
      id: 'card-4',
      category: 'recipient',
      title: 'devon.eth',
      x: 500,
      y: 360,
      fields: { address: 'devon.eth', amount: '1900', doc: 'payslip.pdf' }
    }
    const r4: FlowCard = {
      id: 'card-5',
      category: 'recipient',
      title: 'nova.eth',
      x: 500,
      y: 500,
      fields: { address: 'nova.eth', amount: '3100', doc: '' }
    }
    return {
      cards: [wallet, r1, r2, r3, r4],
      connections: [
        {
          id: 'conn-1',
          from: 'card-1',
          fromPort: 'output',
          to: 'card-2',
          toPort: 'input',
          label: '4200'
        },
        {
          id: 'conn-2',
          from: 'card-1',
          fromPort: 'output',
          to: 'card-3',
          toPort: 'input',
          label: '2800'
        },
        {
          id: 'conn-3',
          from: 'card-1',
          fromPort: 'output',
          to: 'card-4',
          toPort: 'input',
          label: '1900'
        },
        {
          id: 'conn-4',
          from: 'card-1',
          fromPort: 'output',
          to: 'card-5',
          toPort: 'input',
          label: '3100'
        }
      ],
      name: 'Simple Payroll'
    }
  }

  if (type === 'multisig-payroll') {
    const w1: FlowCard = {
      id: 'card-1',
      category: 'wallet',
      title: 'Treasury',
      x: 50,
      y: 80,
      fields: { address: '0x11...aa', balance: '50000' }
    }
    const w2: FlowCard = {
      id: 'card-2',
      category: 'wallet',
      title: 'Operations',
      x: 50,
      y: 240,
      fields: { address: '0x22...bb', balance: '12000' }
    }
    const w3: FlowCard = {
      id: 'card-3',
      category: 'wallet',
      title: 'Rewards',
      x: 50,
      y: 400,
      fields: { address: '0x33...cc', balance: '8000' }
    }
    const gate: FlowCard = {
      id: 'card-4',
      category: 'gate',
      title: 'Multisig Gate',
      x: 380,
      y: 220,
      fields: { required: '2', total: '3' }
    }
    const r1: FlowCard = {
      id: 'card-5',
      category: 'recipient',
      title: 'alix.eth',
      x: 700,
      y: 120,
      fields: { address: 'alix.eth', amount: '4200', doc: '' }
    }
    const r2: FlowCard = {
      id: 'card-6',
      category: 'recipient',
      title: 'devon.eth',
      x: 700,
      y: 280,
      fields: { address: 'devon.eth', amount: '1900', doc: '' }
    }
    const r3: FlowCard = {
      id: 'card-7',
      category: 'recipient',
      title: 'nova.eth',
      x: 700,
      y: 440,
      fields: { address: 'nova.eth', amount: '3100', doc: '' }
    }
    return {
      cards: [w1, w2, w3, gate, r1, r2, r3],
      connections: [
        { id: 'conn-1', from: 'card-1', fromPort: 'output', to: 'card-4', toPort: 'input' },
        { id: 'conn-2', from: 'card-2', fromPort: 'output', to: 'card-4', toPort: 'input' },
        { id: 'conn-3', from: 'card-3', fromPort: 'output', to: 'card-4', toPort: 'input' },
        {
          id: 'conn-4',
          from: 'card-4',
          fromPort: 'output',
          to: 'card-5',
          toPort: 'input',
          label: '4200'
        },
        {
          id: 'conn-5',
          from: 'card-4',
          fromPort: 'output',
          to: 'card-6',
          toPort: 'input',
          label: '1900'
        },
        {
          id: 'conn-6',
          from: 'card-4',
          fromPort: 'output',
          to: 'card-7',
          toPort: 'input',
          label: '3100'
        }
      ],
      name: 'Multisig Payroll'
    }
  }

  return { cards: [], connections: [], name: 'Untitled flow' }
}

export default async function FlowPage({
  searchParams
}: {
  searchParams: Promise<{ type?: string }>
}) {
  const params = await searchParams
  const type = params.type || 'blank'
  const initial = getInitialData(type)

  return (
    <FlowBuilder
      initialCards={initial.cards}
      initialConnections={initial.connections}
      flowName={initial.name}
    />
  )
}
