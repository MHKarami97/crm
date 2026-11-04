import type { Core, EventObject, LayoutOptions } from 'cytoscape'
import type { Person, Relationship, Tag } from '@/domain/models'

export interface GraphNodeData {
  id: string
  name: string
  tags: string[]
  color: string
  size: number
  selectedSize: number
  avatarSvg: string
  degree: number
  phones: string[]
  jobTitle?: string
}

export interface GraphEdgeData {
  id: string
  source: string
  target: string
  type: string
  strength: number
  color: string
}

function getGradientForTags(tags?: string[]): [string, string] {
  if (!tags || tags.length === 0) return ['#0f766e', '#134e4a']

  const t = tags[0].toLowerCase()
  if (t.includes('دوست') || t.includes('friend')) return ['#0d9488', '#0f766e']
  if (t.includes('کار') || t.includes('همکار') || t.includes('work')) return ['#2563eb', '#1d4ed8']
  if (t.includes('خانواده') || t.includes('family')) return ['#e11d48', '#be123c']
  if (t.includes('مشتری') || t.includes('client')) return ['#d97706', '#b45309']
  if (t.includes('vip') || t.includes('ویژه')) return ['#8b5cf6', '#6d28d9']

  return ['#0f766e', '#134e4a']
}

function getEdgeColor(type?: string): string {
  if (!type) return '#94a3b8'
  const t = type.toLowerCase()
  if (t.includes('دوست')) return '#0d9488'
  if (t.includes('کار') || t.includes('همکار')) return '#2563eb'
  if (t.includes('خانواده')) return '#e11d48'
  if (t.includes('مشتری')) return '#d97706'
  if (t.includes('معرف') || t.includes('referral')) return '#059669'
  return '#64748b'
}

function createAvatarSvg(name: string, primaryColor: string, secondaryColor: string): string {
  const initial = name ? name.trim().charAt(0) : '؟'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primaryColor}"/>
        <stop offset="100%" stop-color="${secondaryColor}"/>
      </linearGradient>
    </defs>
    <circle cx="64" cy="64" r="60" fill="url(#g)" stroke="#ffffff" stroke-width="4"/>
    <text x="64" y="74" font-family="Vazirmatn, system-ui, sans-serif" font-size="44" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${initial}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export class CytoscapeService {
  private cy: Core | null = null
  private resizeHandler: (() => void) | null = null

  async init(
    container: HTMLElement,
    people: Person[],
    relationships: Relationship[],
    tags: Tag[],
    onNodeSelect: (personId: string, degree: number) => void,
    onBackgroundTap: () => void
  ): Promise<Core> {
    const cytoscapeModule = await import('cytoscape')
    const cytoscape = cytoscapeModule.default || cytoscapeModule

    const isDark = document.documentElement.classList.contains('dark')

    const elements = this.buildElements(people, relationships)

    if (this.cy) {
      this.cy.destroy()
    }

    this.cy = cytoscape({
      container,
      elements,
      boxSelectionEnabled: false,
      autounselectify: false,
      minZoom: 0.15,
      maxZoom: 3.5,
      wheelSensitivity: 0.2,
      style: [
        // Base Node Style
        {
          selector: 'node',
          style: {
            label: 'data(name)',
            width: 'data(size)',
            height: 'data(size)',
            'background-image': 'data(avatarSvg)',
            'background-fit': 'cover',
            'background-clip': 'node',
            'background-opacity': 1,
            'border-width': 3,
            'border-color': isDark ? '#1e293b' : '#ffffff',
            'border-opacity': 0.95,
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 7,
            'font-family': 'Vazirmatn, sans-serif',
            'font-size': '11.5px',
            'font-weight': 600,
            color: isDark ? '#f8fafc' : '#0f172a',
            'text-background-color': isDark ? '#1e293b' : '#ffffff',
            'text-background-opacity': 0.92,
            'text-background-padding': '3px 7px',
            'text-background-shape': 'roundrectangle',
            'text-border-color': isDark ? '#334155' : '#e2e8f0',
            'text-border-width': 1,
            'text-border-opacity': 0.8,
            'transition-property': 'width, height, border-color, border-width, opacity',
            'transition-duration': 220,
          },
        },
        // Selected Node Style
        {
          selector: 'node:selected, node.selected',
          style: {
            width: 'data(selectedSize)',
            height: 'data(selectedSize)',
            'border-width': 5,
            'border-color': '#f59e0b',
            'border-opacity': 1,
            'z-index': 999,
          },
        },
        // Direct Neighbors of Selected Node
        {
          selector: 'node.neighbor',
          style: {
            'border-width': 4,
            'border-color': '#0ea5e9',
            'border-opacity': 1,
            opacity: 1,
            'z-index': 800,
          },
        },
        // Highlighted Node (Search / Path)
        {
          selector: 'node.highlighted',
          style: {
            'border-width': 5,
            'border-color': '#f59e0b',
            opacity: 1,
            'z-index': 900,
          },
        },
        // Dimmed Node
        {
          selector: 'node.dimmed',
          style: {
            opacity: 0.12,
          },
        },

        // Base Edge Style
        {
          selector: 'edge',
          style: {
            width: 'mapData(strength, 1, 5, 2, 5.5)',
            'line-color': 'data(color)',
            'target-arrow-color': 'data(color)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(type)',
            'font-family': 'Vazirmatn, sans-serif',
            'font-size': '10px',
            'font-weight': 500,
            color: isDark ? '#cbd5e1' : '#475569',
            'text-background-opacity': 0.9,
            'text-background-color': isDark ? '#0f172a' : '#ffffff',
            'text-background-padding': '2px 5px',
            'text-background-shape': 'roundrectangle',
            'text-border-color': isDark ? '#334155' : '#e2e8f0',
            'text-border-width': 1,
            'text-rotation': 'autorotate',
            'arrow-scale': 1.15,
            opacity: 0.72,
            'transition-property': 'line-color, target-arrow-color, width, opacity',
            'transition-duration': 220,
          },
        },
        // Referral Directed Edges
        {
          selector: 'edge[type = "referral"], edge[type = "معرف"]',
          style: {
            'line-color': '#059669',
            'target-arrow-color': '#059669',
            'line-style': 'dashed',
            'line-dash-pattern': [6, 4],
            label: 'معرّف',
            'font-size': '11px',
            'font-weight': 600,
            color: '#059669',
            width: 3.5,
          },
        },
        // Highlighted Edge
        {
          selector: 'edge.highlighted',
          style: {
            'line-color': '#f59e0b',
            'target-arrow-color': '#f59e0b',
            width: 5,
            opacity: 1,
            'z-index': 950,
          },
        },
        // Dimmed Edge
        {
          selector: 'edge.dimmed',
          style: {
            opacity: 0.08,
          },
        },
      ],
      layout: this.getPreferredLayout(people.length),
    })

    // Interactive Tap Selection with Neighborhood Spotlighting
    this.cy.on('tap', 'node', (evt: EventObject) => {
      const node = evt.target
      const nodeId = node.id()
      const degree = node.neighborhood('node').length

      this.cy!.batch(() => {
        // Dim everything
        this.cy!.elements().addClass('dimmed').removeClass('selected neighbor highlighted')

        // Highlight selected node
        node.removeClass('dimmed').addClass('selected')

        // Highlight direct neighbors
        const neighbors = node.neighborhood('node')
        neighbors.removeClass('dimmed').addClass('neighbor')

        // Highlight connecting edges
        const connectedEdges = node.connectedEdges()
        connectedEdges.removeClass('dimmed').addClass('highlighted')
      })

      onNodeSelect(nodeId, degree)
    })

    // Tap background to clear spotlight
    this.cy.on('tap', (evt: EventObject) => {
      if (evt.target === this.cy) {
        this.clearSelection()
        onBackgroundTap()
      }
    })

    if (this.resizeHandler && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeHandler)
    }
    this.resizeHandler = () => {
      this.cy?.resize()
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', this.resizeHandler)
    }

    return this.cy
  }

  clearSelection() {
    if (!this.cy) return
    this.cy.batch(() => {
      this.cy!.elements().removeClass('dimmed selected neighbor highlighted')
    })
  }

  filterByTag(tagName: string | null) {
    if (!this.cy) return

    this.cy.batch(() => {
      if (!tagName || tagName === 'all') {
        this.cy!.elements().removeClass('dimmed highlighted')
        return
      }

      const matching = this.cy!.nodes().filter((node) => {
        const tags: string[] = node.data('tags') || []
        return tags.includes(tagName)
      })

      if (matching.length > 0) {
        this.cy!.elements().addClass('dimmed')
        matching.removeClass('dimmed').addClass('highlighted')
        matching.connectedEdges().filter((e) => {
          return matching.contains(e.source()) && matching.contains(e.target())
        }).removeClass('dimmed').addClass('highlighted')
        this.cy!.fit(matching, 60)
      } else {
        this.cy!.elements().addClass('dimmed')
      }
    })
  }

  private getPreferredLayout(nodeCount: number): LayoutOptions {
    if (nodeCount <= 80) {
      return {
        name: 'cose',
        animate: true,
        animationDuration: 700,
        nodeRepulsion: () => 6000,
        idealEdgeLength: () => 140,
        edgeElasticity: () => 120,
        gravity: 0.2,
        numIter: 600,
        padding: 50,
      } as any
    } else if (nodeCount <= 500) {
      return {
        name: 'concentric',
        concentric: (node: any) => node.degree(),
        levelWidth: () => 2,
        padding: 50,
        animate: false,
      } as any
    } else {
      return {
        name: 'concentric',
        padding: 50,
        animate: false,
      } as any
    }
  }

  runLayout(name: 'cose' | 'concentric' | 'circle' | 'breadthfirst') {
    if (!this.cy) return

    let layoutOpts: any = {
      name,
      animate: this.cy.nodes().length < 200,
      animationDuration: 600,
      padding: 50,
    }

    if (name === 'cose') {
      layoutOpts = {
        ...layoutOpts,
        nodeRepulsion: () => 6000,
        idealEdgeLength: () => 140,
        gravity: 0.2,
      }
    } else if (name === 'concentric') {
      layoutOpts = {
        ...layoutOpts,
        concentric: (node: any) => node.degree(),
        levelWidth: () => 2,
      }
    }

    const layout = this.cy.layout(layoutOpts)
    layout.run()
  }

  zoomIn() {
    if (!this.cy) return
    this.cy.zoom({
      level: this.cy.zoom() * 1.3,
      renderedPosition: { x: this.cy.width() / 2, y: this.cy.height() / 2 },
    })
  }

  zoomOut() {
    if (!this.cy) return
    this.cy.zoom({
      level: this.cy.zoom() * 0.7,
      renderedPosition: { x: this.cy.width() / 2, y: this.cy.height() / 2 },
    })
  }

  fit() {
    if (!this.cy) return
    this.cy.fit(undefined, 50)
  }

  highlightSearch(query: string) {
    if (!this.cy) return
    const q = query.trim().toLowerCase()

    this.cy.batch(() => {
      if (!q) {
        this.cy!.elements().removeClass('dimmed highlighted')
        return
      }

      const matchingNodes = this.cy!.nodes().filter((node) => {
        const name = (node.data('name') || '').toLowerCase()
        const job = (node.data('jobTitle') || '').toLowerCase()
        return name.includes(q) || job.includes(q)
      })

      if (matchingNodes.length > 0) {
        this.cy!.elements().addClass('dimmed')
        matchingNodes.removeClass('dimmed').addClass('highlighted')
        matchingNodes.connectedEdges().removeClass('dimmed').addClass('highlighted')
        this.cy!.fit(matchingNodes, 80)
      } else {
        this.cy!.elements().removeClass('highlighted')
        this.cy!.elements().addClass('dimmed')
      }
    })
  }

  highlightPath(nodeIds: string[]) {
    if (!this.cy || nodeIds.length === 0) return

    this.cy.batch(() => {
      this.cy!.elements().addClass('dimmed').removeClass('highlighted selected neighbor')

      const pathNodes = this.cy!.nodes().filter((node) => nodeIds.includes(node.id()))
      pathNodes.removeClass('dimmed').addClass('highlighted')

      for (let i = 0; i < nodeIds.length - 1; i++) {
        const u = nodeIds[i]
        const v = nodeIds[i + 1]
        const edges = this.cy!.edges().filter(
          (edge) =>
            (edge.source().id() === u && edge.target().id() === v) ||
            (edge.source().id() === v && edge.target().id() === u)
        )
        edges.removeClass('dimmed').addClass('highlighted')
      }

      this.cy!.fit(pathNodes, 80)
    })
  }

  selectNode(personId: string) {
    if (!this.cy) return
    const node = this.cy.getElementById(personId)
    if (node && node.length > 0) {
      node.emit('tap')
      this.cy.center(node)
    }
  }

  destroy() {
    if (this.resizeHandler && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeHandler)
      this.resizeHandler = null
    }
    if (this.cy) {
      this.cy.destroy()
      this.cy = null
    }
  }

  private buildElements(people: Person[], relationships: Relationship[]) {
    // 1. Calculate degree for each person
    const degreeMap = new Map<string, number>()
    for (const p of people) {
      degreeMap.set(p.id, 0)
    }
    for (const r of relationships) {
      if (degreeMap.has(r.sourcePersonId)) {
        degreeMap.set(r.sourcePersonId, (degreeMap.get(r.sourcePersonId) || 0) + 1)
      }
      if (degreeMap.has(r.targetPersonId)) {
        degreeMap.set(r.targetPersonId, (degreeMap.get(r.targetPersonId) || 0) + 1)
      }
    }

    const nodes = people.map((p) => {
      const degree = degreeMap.get(p.id) || 0
      // Scale node size smoothly with connection count (48px - 66px)
      const size = Math.min(66, Math.max(48, Math.round(48 + degree * 2.5)))
      const selectedSize = Math.round(size * 1.25)
      const [grad1, grad2] = getGradientForTags(p.tags)
      const avatarSvg = createAvatarSvg(p.name, grad1, grad2)

      return {
        data: {
          id: p.id,
          name: p.name,
          tags: p.tags,
          degree,
          size,
          selectedSize,
          avatarSvg,
          phones: p.phones,
          jobTitle: p.customFields?.jobTitle || '',
        },
      }
    })

    const peopleIds = new Set(people.map((p) => p.id))
    const edges = relationships
      .filter((r) => peopleIds.has(r.sourcePersonId) && peopleIds.has(r.targetPersonId))
      .map((r) => ({
        data: {
          id: r.id,
          source: r.sourcePersonId,
          target: r.targetPersonId,
          type: r.type || 'ارتباط',
          strength: r.strength || 3,
          color: getEdgeColor(r.type),
        },
      }))

    return [...nodes, ...edges]
  }
}

export const cytoscapeService = new CytoscapeService()
