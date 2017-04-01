!function () {
  const el = document.querySelector('.container')
  const model = new Lobbyist.Models.Dataset()
  const network = new Lobbyist.Views.Network({ el, model })

  model.fetch()
}()
