namespace('Lobbyist.Models')

class Dataset {
  constructor (data) {
    this.year = '2016'
    this.recipient = null
    this.data = data
    this._on = {}
  }

  set (field, value) {
    this[field] = value
    this.trigger('change')
  }

  fetch () {
    d3.json('./public/javascripts/datasets/data.json', (error, data) => {
      this.data = data
      this.trigger('change')
    })
  }

  getRecipients () {
    return [...new Set(
      this.data[this.year].links
        .map(contribution => contribution.target.id || contribution.target)
        .filter(target => target.includes(' (Recipient)'))
        .sort()
      )
    ]
  }

  getContributionsTo (recipient) {
    return this.data[this.year].links
      .filter(link => link.target.id.includes(recipient))
      .map(link => ({ x: link.source.id, y: link.value }))
  }

  getContributionsFrom (funder) {
    return this.data[this.year].links
      .filter(link => link.source.id.includes(funder))
      .map(link => ({ x: link.target.id, y: link.value }))
  }

  filter (data) {
    const lobbyistLinks = data.links.filter(contribution => contribution.target.id === this.recipient)
    const lobbyists = lobbyistLinks.map(contribution => contribution.source.id)
    const employerLinks = data.links.filter(contribution => lobbyists.includes(contribution.target.id))
    const employers = employerLinks.map(contribution => contribution.source.id)
    const nodes = data.nodes.filter(({ id }) => {
      return this.recipient === id || lobbyists.includes(id) || employers.includes(id)
    })
    const links = [...lobbyistLinks, ...employerLinks].map(link => {
      return { source: link.source.id, target: link.target.id, value: link.value }
    })

    return { nodes, links }
  }

  toJSON () {
    if (this.recipient) {
      return this.filter(JSON.parse(JSON.stringify(this.data[this.year])));
    } else {
      return this.data[this.year]
    }
  }

  on (event, callback) {
    this._on[event] = callback
  }

  trigger (event) {
    this._on[event](this)
  }
}

Lobbyist.Models.Dataset = Dataset
