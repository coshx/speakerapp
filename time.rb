require 'sinatra'
require 'json'

get "/" do
  redirect '/index.html'
end

get '/time' do
   content_type :json
    { :time => (Time.now.utc.to_f * 1000.0).to_i}.to_json
end

post '/post_start_time' do
  logger.info("{local_time: #{params[:local_time]}, audio_position: #{params[:audio_position]}" )
end


