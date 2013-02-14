require 'sinatra'
require 'json'

get '/' do
  content_type :json
    { :time => (Time.now.utc.to_f * 1000.0).to_i}.to_json
end