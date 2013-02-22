require 'sinatra'
require 'json'


class Song

  @title = ""
  @url =""
  @start_time = 0

  def self.update(options={})
    @title = options[:title]
    @url = options[:url]
    @start_time = (Time.now.utc.to_f * 1000.0).to_i
  end

  def self.title()
    @title
  end

  def self.url()
    @url
  end

  def self.start()
    @start_time
  end

end

get "/" do
  redirect '/speakerapp.html'
end

get '/time' do
  # # simulate a delay
  # # uniform distribution, avg. 100, ±25
  # ms_to_sleep = 100+rand()*50-25
  # sleep(ms_to_sleep / 1000.0)
  content_type :json
  { :time => (Time.now.utc.to_f * 1000.0).to_i}.to_json
end

post '/song_info' do
   Song.update({:title=>params[:title],:url=>params[:url]})   #why is @start_time changing?
   content_type :json
   {}.to_json
end

get '/song_info' do
  content_type :json
  {title: Song.title(), url: Song.url(), start_at: Song.start()}.to_json
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

