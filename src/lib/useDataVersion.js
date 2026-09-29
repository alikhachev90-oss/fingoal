import { useEffect, useState } from 'react'

// A number that goes up whenever the app's data changes (see notifyChange in
// db.js). Put it in a loading effect's dependencies to reload on changes.
export function useDataVersion() {
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const bump = () => setVersion((v) => v + 1)
    window.addEventListener('fintera-data-changed', bump)
    return () => window.removeEventListener('fintera-data-changed', bump)
  }, [])
  return version
}
