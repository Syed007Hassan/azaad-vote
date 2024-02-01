import createStateContext from 'react-use/lib/factory/createStateContext'
import useAsyncRefresh from './useAsyncRefresh'

export interface ProcessedForm33 {
  [key: string]: {
    constituency_no: string
    constituency_name: string
    candidates: {
      symbol_url: string
      candidate_name: string
      pti_backed: boolean
    }[]
  }
}

const [useSharedState, SharedStateProvider] =
  createStateContext<ProcessedForm33>(undefined as any)

export interface Form33Candidate {
  SerialNo: number
  'Name in English': string
  'Name in Urdu': string
  Address: string
  Symbol: string
  Party: string
  symbol_url: string
  pti_backed?: {
    whatsapp_channel: string
  }
}

export type Provinces = 'Punjab' | 'Sindh' | 'KPK' | 'Balochistan'

export interface Constituency {
  'Constituency No': string
  'Constituency Name': string
  'Returning Officer': string
  NumPages: number
  PageFiles: string[]
  Candidates: Form33Candidate[]
  province: Provinces
}

function AddProvinceName(province: string) {
  return (data: any) => {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        {
          ...(value as any),
          province: province
        }
      ])
    )
  }
}

export const useLoadCandidateData = () => {
  const { value } = useAsyncRefresh(async () => {
    const [balochistan, kpk, punjab, sindh] = await Promise.all([
      fetch('https://elections-data.vercel.app/NA/balochistan.json')
        .then((r) => r.json())
        .then(AddProvinceName('Balochistan')),
      fetch('https://elections-data.vercel.app/NA/kpk.json')
        .then((r) => r.json())
        .then(AddProvinceName('KPK')),
      fetch('https://elections-data.vercel.app/NA/punjab.json')
        .then((r) => r.json())
        .then(AddProvinceName('Punjab')),
      fetch('https://elections-data.vercel.app/NA/sindh.json')
        .then((r) => r.json())
        .then(AddProvinceName('Sindh'))
    ])

    const combined = {
      ...balochistan,
      ...kpk,
      ...punjab,
      ...sindh
    } as {
      [key: string]: Constituency
    }

    const form33: ProcessedForm33 = Object.fromEntries(
      Object.entries(combined).map(([constituency_no, constituency]) => {
        const candidates = constituency.Candidates.map((candidate) => {
          return {
            symbol_url: candidate.symbol_url,
            candidate_name: candidate['Name in Urdu'],
            pti_backed: !!candidate.pti_backed
          }
        })

        return [
          constituency_no,
          {
            constituency_no,
            constituency_name: constituency['Constituency Name'],
            candidates
          }
        ]
      })
    )

    return form33
  }, [])

  return value
}

export const Form33Provider = SharedStateProvider
export const useForm33 = useSharedState
