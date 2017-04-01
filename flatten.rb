require 'csv'

lobbyists = {}

CSV.foreach('./lobbyist.csv', headers: true, header_converters: :symbol) do |row|
  id = row[:lobbyist_id]

  lobbyists[id] = {
    employer: row[:employer_name]
  }
end

results = []

CSV.foreach('./contributions.csv', headers: true, header_converters: :symbol) do |row|
  id = row[:lobbyist_id]

  results << [
    row[:contribution_date],
    row[:recipient],
    row[:amount],
    "#{row[:lobbyist_first_name]} #{row[:lobbyist_last_name]}",
    lobbyists[id][:employer]
  ]
end

CSV.open('./flattened.csv', 'w') do |csv|
  csv << %w(date recipient amount lobbyist employer)

  results.each do |row|
    csv << row
  end
end
