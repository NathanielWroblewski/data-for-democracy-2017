namespace('Lobbyist.Views')

const YEARS = ['2012', '2013', '2014', '2015', '2016']
const MAX_DISTANCE = 100

class Network {
  constructor ({ el, model }) {
    this.el = el
    this.model = model

    this.model.on('change', () => this.render())
  }

  updateYear (e) {
    this.model.set('year', e.target.value)
  }

  updateRecipient (e) {
    const { value } = e.target || null

    this.model.set('recipient', value)
  }

  graph (network) {
    const svg = d3.select('svg')
    const width = window.innerWidth
    const height = window.innerHeight
    const color = d3.scaleOrdinal(d3.schemeCategory20)
    const simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.id))
      .force('charge', d3.forceManyBody().distanceMax(MAX_DISTANCE))
      .force('center', d3.forceCenter(width / 2, height / 2))
    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(network.links)
      .enter().append('line')
      .attr('stroke-width', d => Math.sqrt(d.value))
      .on('mouseover', (d) => this.showConnection(d))
      // .style("marker-end",  "url(#suit)");
    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(network.nodes)
      .enter().append('circle')
      .attr('r', 5)
      .attr('fill', d => color(d.group))
      .call(d3.drag()
          .on('start', this.dragstarted)
          .on('drag', this.dragged)
          .on('end', this.dragended))
      .on('mouseover', (d) => this.showNode(d))
      .on('mouseout', this.hideCaption)

    simulation.nodes(network.nodes).on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
    })
    simulation.force('link').links(network.links)
  }

  showConnection (d) {
    const caption = document.querySelector('.caption')

    caption.innerHTML = `
      ${this.titleize(d.source.id)} gave $${d.value} to ${this.titleize(d.target.id)}
    `
  }

  dragstarted (d) {
    if (!d3.event.active) simulation.alphaTarget(0.3).restart()
    d.fx = d.x
    d.fy = d.y
  }

  dragged (d) {
    d.fx = d3.event.x
    d.fy = d3.event.y
  }

  dragended (d) {
    if (!d3.event.active) simulation.alphaTarget(0)
    d.fx = null
    d.fy = null
  }

  showNode (d) {
    document.querySelector('.caption').innerHTML = `${this.titleize(d.id)}`
  }

  hideCaption (d) {
    document.querySelector('.caption').innerHTML = '';
  }

  capitalize (string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  titleize (string) {
    return string.split(' ').map(word => this.capitalize(word)).join(' ')
  }

  template () {
    let html = `
      <div class="svg-container">
        <svg></svg>
      </div>
      <div class="content">
        <h1 class="title">Lobbyist Connections</h1>
        <p class="subtitle">How are funders and City of Chicago elected officials connected through lobbyists?</p>
        <p class="label">Year <select class="year">
    `
    YEARS.reduce((memo, year) => {
      const selected = year === this.model.year ? 'selected' : ''

      return html += `<option value="${year}" ${selected}>${year}</option>`
    }, html)

    html += `</select> Recipient <select class="recipient"><option></option>`

    this.model.getRecipients().reduce((memo, recipient) => {
      const selected = recipient === this.model.recipient ? 'selected' : ''

      return html += `
        <option value="${recipient}" ${selected}>
          ${this.titleize(recipient.replace(' (Recipient)', ''))}
        </option>
      `
    }, html)

    html += `
        </select></p>
        <p class="caption"></p>
      </div>
    `

    return html
  }

  render () {
    this.el.innerHTML = this.template()
    this.graph(this.model.toJSON())
    this.el.querySelector('.year').addEventListener('change', e => this.updateYear(e));
    this.el.querySelector('.recipient').addEventListener('change', e => this.updateRecipient(e));

    return this
  }
}

Lobbyist.Views.Network = Network
