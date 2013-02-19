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
  logger.info("{id: #{params[:id]}, latency: #{params[:latency]}, skew: #{params[:skew]}}" )
end

get '/guess' do
  content_type :json
  client_time = params[:client].to_f
  request_time = params[:requestTime].to_f

  current_time = Time.now.to_f * 1000
  skew = (current_time - client_time - request_time)

  # simulate a delay
  # uniform distribution, avg. 100, ±25
  #ms_to_sleep = 100+rand()*50-25
  #sleep(ms_to_sleep / 1000.0)

  {:skew => skew}.to_json
end

