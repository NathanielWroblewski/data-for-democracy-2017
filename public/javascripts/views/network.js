namespace('Lobbyist.Views')

const YEARS = ['2012', '2013', '2014', '2015', '2016']
const MAX_DISTANCE = 100

class Network {
  constructor ({ el, model }) {
    this.el = el
    this.model = model
    this.profile = null

    this.model.on('change', () => this.render())
  }

  toggleProfile (d) {
    this.profile = {
      id: d.id,
      group: d.group
    }
    this.render()
  }

  updateYear (e) {
    this.model.set('recipient', null)
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
      .attr('stroke-width', d => Math.sqrt(d.value / 1000))
      .on('mouseover', (d) => this.showConnection(d))
      // .style("marker-end",  "url(#suit)");
    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(network.nodes)
      .enter().append('circle')
      .attr('r', 5)
      .attr('fill', d => color(d.group))
      // .call(d3.drag()
      //     .on('start', this.dragstarted)
      //     .on('drag', this.dragged)
      //     .on('end', this.dragended))
      .on('mouseover', (d) => this.showNode(d))
      .on('mouseout', this.hideCaption)

    this.simulation = simulation

    simulation.nodes(network.nodes).on('tick', () => {
      if (this.simulation) {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y)
        node
          .attr('cx', d => d.x)
          .attr('cy', d => d.y)
      }
    })
    simulation.force('link').links(network.links)
  }

  showConnection (d) {
    const caption = document.querySelector('.caption')

    caption.innerHTML = `
      ${this.templateName(d.source)} gave
      <span class="money">$${d.value.toLocaleString()}</span>
      to ${this.templateName(d.target)}
    `
  }

  // dragstarted (d) {
  //   if (!d3.event.active) simulation.alphaTarget(0.3).restart()
  //   d.fx = d.x
  //   d.fy = d.y
  // }

  // dragged (d) {
  //   d.fx = d3.event.x
  //   d.fy = d3.event.y
  // }

  // dragended (d) {
  //   if (!d3.event.active) simulation.alphaTarget(0)
  //   d.fx = null
  //   d.fy = null
  // }

  showNode (d) {
    document.querySelector('.caption').innerHTML = this.templateName(d)
  }

  templateName (d) {
    const [name, role] = this.titleize(d.id).split(/\s(?=\()/)

    return `<span class="name">${name}</span> ${role}`
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

  networkTemplate () {
    let html = `
      <div class="svg-container">
        <svg></svg>
      </div>
      <div class="content">
        <h1 class="title overlay">Lobbyist Connections</h1>
        <p class="subtitle overlay">How are funders and City of Chicago elected officials connected through lobbyists?</p>
        <p class="label overlay">Year <select class="year">
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
        <p class="caption overlay"></p>
      </div>
    `

    return html
  }

  renderNetwork () {
    this.el.innerHTML = this.networkTemplate()
    this.graph(this.model.toJSON())
    this.el.querySelector('.year')
      .addEventListener('change', e => this.updateYear(e));
    this.el.querySelector('.recipient')
      .addEventListener('change', e => this.updateRecipient(e));
    d3.selectAll('.nodes circle').on('click', d => this.toggleProfile(d));
  }

  profileTemplate () {
    return `
      <div class="content">
        <h1 class="title overlay">${this.profile.id}</h1>
        <svg height="400" width="800"></svg>
      </div>
    `
  }

  chartBars (data) {
    const svg = d3.select('svg')
    const margin = { top: 20, right: 20, bottom: 30, left: 40 }
    const width = +svg.attr('width') - margin.left - margin.right
    const height = +svg.attr('height') - margin.top - margin.bottom
    const x = d3.scaleBand().rangeRound([0, width]).padding(0.1)
    const y = d3.scaleLinear().rangeRound([height, 0])
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    x.domain(data.map(d => d.x.replace(' (Recipient)', '')))
    y.domain([0, d3.max(data, d => d.y)])

    g.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))

    g.append('g')
      .attr('class', 'axis axis--y')
      .call(d3.axisLeft(y).ticks(10))
      .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 6)
        .attr('dy', '0.71em')
        .attr('text-anchor', 'end')
        .text('$');

    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.x))
        .attr('y', d => y(d.y))
        .attr('width', x.bandwidth())
        .attr('height', d => height - y(d.y))
  }

  renderProfile () {
    const { id, group } = this.profile;

    this.el.innerHTML = this.profileTemplate()

    if (group === 1) {
      this.chartBars(this.model.getContributionsTo(id))
    } else {
      this.chartBars(this.model.getContributionsFrom(id))
    }
  }

  render () {
    this.profile ? this.renderProfile() : this.renderNetwork()

    return this
  }
}

Lobbyist.Views.Network = Network
