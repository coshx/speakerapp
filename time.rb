require 'sinatra'
require 'json'

get "/" do
  redirect '/index.html'
end

get '/time' do
  # # simulate a delay
  # # uniform distribution, avg. 100, ±25
  # ms_to_sleep = 100+rand()*50-25
  # sleep(ms_to_sleep / 1000.0)

  content_type :json
  { :time => (Time.now.utc.to_f * 1000.0).to_i}.to_json
end

get '/song_info' do
  #thirdday_duration = 210000ms
  rainbow_duration = 222000
  milliseconds_in_a_minute = 60*1000
  now = (Time.now.utc.to_f * 1000.0).to_i
  song_start = now - (now %  milliseconds_in_a_minute) ; #song starts every minute on the minute
  content_type :json
  {title: "rainbow", url: "http://speakerapp.herokuapp.com/media/rainbow.mp3", start_at: song_start, duration: rainbow_duration}.to_json
end

post '/post_start_time' do
  logger.info("{id: #{params[:id]}, latency: #{params[:latency]}, skew: #{params[:skew]}}" )
end

get '/guess' do
  # # simulate a delay
  # # uniform distribution, avg. 100, ±25
  # ms_to_sleep = 100+rand()*50-25
  # sleep(ms_to_sleep / 1000.0)

  content_type :json
  client_time = params[:client].to_f
  request_time = params[:requestTime].to_f

  current_time = Time.now.to_f * 1000
  skew = (current_time - client_time - request_time)

  {:skew => skew}.to_json
end

