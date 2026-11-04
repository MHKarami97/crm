import type { Relationship } from '@/domain/models'

export interface PathStep {
  personId: string
  personName: string
  relationship?: Relationship
}

export interface PathFindingResult {
  found: boolean
  path: PathStep[]
  degreesOfSeparation: number
}

export class PathFindingService {
  /**
   * Breadth-First Search (BFS) to find the shortest introduction path
   * between two people, accounting for relationship edges (undirected exploration for connections).
   */
  findShortestPath(
    startId: string,
    targetId: string,
    peopleMap: Map<string, { id: string; name: string }>,
    relationships: Relationship[]
  ): PathFindingResult {
    if (startId === targetId) {
      const person = peopleMap.get(startId)
      return {
        found: true,
        degreesOfSeparation: 0,
        path: [{ personId: startId, personName: person?.name || 'شخص' }],
      }
    }

    // Build adjacency list: node -> array of { neighborId, relationship }
    const adjacency = new Map<string, Array<{ neighborId: string; relationship: Relationship }>>()

    for (const rel of relationships) {
      if (!adjacency.has(rel.sourcePersonId)) adjacency.set(rel.sourcePersonId, [])
      if (!adjacency.has(rel.targetPersonId)) adjacency.set(rel.targetPersonId, [])

      adjacency.get(rel.sourcePersonId)!.push({
        neighborId: rel.targetPersonId,
        relationship: rel,
      })
      adjacency.get(rel.targetPersonId)!.push({
        neighborId: rel.sourcePersonId,
        relationship: rel,
      })
    }

    // Queue for BFS: holds current person ID
    const queue: string[] = [startId]
    const visited = new Set<string>([startId])

    // Predecessor map to reconstruct path:
    // personId -> { fromId, relationship }
    const cameFrom = new Map<string, { fromId: string; relationship: Relationship }>()

    let found = false

    while (queue.length > 0) {
      const current = queue.shift()!
      if (current === targetId) {
        found = true
        break
      }

      const neighbors = adjacency.get(current) || []
      for (const { neighborId, relationship } of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId)
          cameFrom.set(neighborId, { fromId: current, relationship })
          queue.push(neighborId)
        }
      }
    }

    if (!found) {
      return {
        found: false,
        degreesOfSeparation: -1,
        path: [],
      }
    }

    // Reconstruct the path backwards from targetId to startId
    const reconstructed: PathStep[] = []
    let curr = targetId

    while (curr !== startId) {
      const step = cameFrom.get(curr)!
      const p = peopleMap.get(curr)
      reconstructed.unshift({
        personId: curr,
        personName: p?.name || 'ناشناس',
        relationship: step.relationship,
      })
      curr = step.fromId
    }

    // Add starting person
    const startPerson = peopleMap.get(startId)
    reconstructed.unshift({
      personId: startId,
      personName: startPerson?.name || 'ناشناس',
    })

    return {
      found: true,
      degreesOfSeparation: reconstructed.length - 1,
      path: reconstructed,
    }
  }
}

export const pathFindingService = new PathFindingService()
