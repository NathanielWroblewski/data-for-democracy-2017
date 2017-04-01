require 'csv'
require 'json'
require 'active_support/inflector'

TIME_FRAME = 2012..2016
contributions = {}

TIME_FRAME.each do |year|
  contributions[year] = {
    nodes: [],
    links: [],
    recipients: {},
    lobbyists: {},
    employers: {},
    contributions: {}
  }
end

CSV.foreach('./flattened.csv', headers: true, header_converters: :symbol) do |row|
  year = row[:date].split('/').last.to_i
  recipient = "#{row[:recipient].titleize} (Recipient)"
  lobbyist = "#{row[:lobbyist].titleize} (Lobbyist)"
  employer = "#{row[:employer].titleize} (Funder)"
  amount = row[:amount].delete('$').delete(',').to_i

  if TIME_FRAME.include?(year) && amount > 0 && lobbyist && employer
    contributions[year][:recipients][recipient] = true
    contributions[year][:lobbyists][lobbyist] = true
    contributions[year][:employers][employer] = true

    contributions[year][:contributions][lobbyist] ||= Hash.new(0)
    contributions[year][:contributions][lobbyist][recipient] += amount
    contributions[year][:contributions][employer] ||= Hash.new(0)
    contributions[year][:contributions][employer][lobbyist] += amount
  end
end

contributions.each do |year, contributions_for_year|
  contributions_for_year[:recipients].each do |recipient, value|
    contributions_for_year[:nodes] << { id: recipient, group: 1 }
  end

  contributions_for_year[:lobbyists].each do |lobbyist, value|
    contributions_for_year[:nodes] << { id: lobbyist, group: 2 }
  end

  contributions_for_year[:employers].each do |employer, value|
    contributions_for_year[:nodes] << { id: employer, group: 3 }
  end

  contributions_for_year[:contributions].each do |source, contribution|
    contribution.each do |target, amount|
      contributions_for_year[:links] << {
        source: source,
        target: target,
        value: amount
      }
    end
  end
end

File.open('./public/javascripts/datasets/data.json', 'w') do |file|
  file.write(contributions.to_json)
end
