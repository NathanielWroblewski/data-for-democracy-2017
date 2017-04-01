require 'csv'
require 'json'

recipients = {}
lobbyists = {}
employers = {}

nodes = []
links = []

CSV.foreach('./flattened.csv', headers: true, header_converters: :symbol) do |row|
  year = row[:date].split('/').last.to_i
  recipient = row[:recipient] + ' - Recipient'
  lobbyist = row[:lobbyist] + ' - Lobbyist'
  employer = row[:employer] + ' - Employer'
  amount = row[:amount].delete('$').delete(',').to_i

  if year == 2016 && amount > 0
    recipients[recipient] = true
    lobbyists[lobbyist] = true
    employers[employer] = true

    links << {
      source: lobbyist,
      target: recipient,
      value: amount
    }

    links << {
      source: employer,
      target: lobbyist,
      value: amount
    }
  end
end

recipients.each do |key, value|
  nodes << { id: key, group: 1 }
end

lobbyists.each do |key, value|
  nodes << { id: key, group: 2 }
end

employers.each do |key, value|
  nodes << { id: key, group: 3 }
end

File.open('./public/javascripts/datasets/data.json', 'w') do |file|
  file.write({
    nodes: nodes,
    links: links
  }.to_json)
end
