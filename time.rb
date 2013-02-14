require 'sinatra'
require 'json'

set :public_folder, 'public'

get "/" do
  redirect '/index.html'
end

get '/time' do
  content_type :json
    { :time => (Time.now.utc.to_f * 1000.0).to_i}.to_json
end