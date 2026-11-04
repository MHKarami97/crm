import type { Core, EventObject, LayoutOptions } from 'cytoscape'
import type { Person, Relationship, Tag } from '@/domain/models'

export interface GraphNodeData {
  id: string
  name: string
  tags: string[]
  color: string
  phones: string[]
  jobTitle?: string
}

export interface GraphEdgeData {
  id: string
  source: string
  target: string
  type: string
  strength: number
}

export class CytoscapeService {
  private cy: Core | null = null
  private resizeHandler: (() => void) | null = null

  async init(
    container: HTMLElement,
    people: Person[],
    relationships: Relationship[],
    tags: Tag[],
    onNodeSelect: (personId: string) => void,
    onBackgroundTap: () => void
  ): Promise<Core> {
    // Lazy load cytoscape for bundle performance
    const cytoscapeModule = await import('cytoscape')
    const cytoscape = cytoscapeModule.default || cytoscapeModule

    // Map tag colors
    const tagColorMap = new Map<string, string>()
    for (const t of tags) {
      tagColorMap.set(t.name, t.color)
    }

    const elements = this.buildElements(people, relationships, tagColorMap)

    // Destroy existing instance if any
    if (this.cy) {
      this.cy.destroy()
    }

    this.cy = cytoscape({
      container,
      elements,
      boxSelectionEnabled: false,
      autounselectify: false,
      minZoom: 0.1,
      maxZoom: 3.5,
      wheelSensitivity: 0.25,
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(name)',
            'background-color': 'data(color)',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 6,
            'font-family': 'Vazirmatn, sans-serif',
            'font-size': '13px',
            'font-weight': 500,
            color: '#0f172a',
            'text-outline-color': '#ffffff',
            'text-outline-width': 2,
            width: 48,
            height: 48,
            'border-width': 2,
            'border-color': '#ffffff',
            'transition-property': 'background-color, border-color, border-width, opacity',
            'transition-duration': 250,
          },
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#f59e0b',
            'border-opacity': 1,
          },
        },
        {
          selector: 'node.highlighted',
          style: {
            'border-width': 4,
            'border-color': '#f59e0b',
            width: 56,
            height: 56,
            opacity: 1,
            'z-index': 99,
          },
        },
        {
          selector: 'node.dimmed',
          style: {
            opacity: 0.15,
          },
        },
        {
          selector: 'edge',
          style: {
            width: 'mapData(strength, 1, 5, 2, 6)',
            'line-color': '#94a3b8',
            'target-arrow-color': '#94a3b8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(type)',
            'font-family': 'Vazirmatn, sans-serif',
            'font-size': '10px',
            color: '#64748b',
            'text-background-opacity': 0.8,
            'text-background-color': '#ffffff',
            'text-background-padding': '2px',
            'text-background-shape': 'roundrectangle',
            'text-rotation': 'autorotate',
            'arrow-scale': 1.1,
            opacity: 0.75,
            'transition-property': 'line-color, target-arrow-color, width, opacity',
            'transition-duration': 250,
          },
        },
        {
          selector: 'edge.highlighted',
          style: {
            'line-color': '#f59e0b',
            'target-arrow-color': '#f59e0b',
            width: 5,
            opacity: 1,
            'z-index': 99,
          },
        },
        {
          selector: 'edge.dimmed',
          style: {
            opacity: 0.1,
          },
        },
      ],
      layout: this.getPreferredLayout(people.length),
    })

    // Bind touch & click events
    this.cy.on('tap', 'node', (evt: EventObject) => {
      const node = evt.target
      onNodeSelect(node.id())
    })

    this.cy.on('tap', (evt: EventObject) => {
      if (evt.target === this.cy) {
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

  private getPreferredLayout(nodeCount: number): LayoutOptions {
    if (nodeCount <= 80) {
      return {
        name: 'cose',
        animate: true,
        animationDuration: 600,
        nodeRepulsion: () => 4500,
        idealEdgeLength: () => 120,
        edgeElasticity: () => 100,
        gravity: 0.25,
        numIter: 500,
        padding: 40,
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
      // Extremely fast grid / circle layout for 1000+ benchmark
      return {
        name: 'concentric',
        padding: 50,
        animate: false,
      } as any
    }
  }

  runLayout(name: 'cose' | 'concentric' | 'circle' | 'breadthfirst') {
    if (!this.cy) return
    const layout = this.cy.layout({
      name,
      animate: this.cy.nodes().length < 200,
      animationDuration: 500,
      padding: 40,
    } as any)
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
    this.cy.fit(undefined, 40)
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
        return name.includes(q)
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
      this.cy!.elements().addClass('dimmed').removeClass('highlighted')

      const pathNodes = this.cy!.nodes().filter((node) => nodeIds.includes(node.id()))
      pathNodes.removeClass('dimmed').addClass('highlighted')

      // Highlight edges between consecutive path nodes
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
      this.cy.nodes().unselect()
      node.select()
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

  private buildElements(
    people: Person[],
    relationships: Relationship[],
    tagColorMap: Map<string, string>
  ) {
    const nodes = people.map((p) => {
      // Choose primary color from first tag or default teal
      let color = '#0f766e'
      if (p.tags && p.tags.length > 0) {
        const firstTag = p.tags[0]
        color = tagColorMap.get(firstTag) || color
      }

      return {
        data: {
          id: p.id,
          name: p.name,
          tags: p.tags,
          color,
          phones: p.phones,
          jobTitle: p.customFields?.jobTitle || '',
        },
      }
    })

    // Filter edges to ensure source & target exist in current nodes
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
        },
      }))

    return [...nodes, ...edges]
  }
}

export const cytoscapeService = new CytoscapeService()
