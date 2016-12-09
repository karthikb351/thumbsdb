import json
import re
import IPython


class IdleVideo(object):
  def __init__(self, title, episode, description, videoId, date, duration, timecodes):
    self.title = title
    self.episode = episode
    self.description = description
    self.videoId = videoId
    self.date = date
    self.duration = duration
    self.timecodes = timecodes


class IdleTimecodeType(object):
  standard = "segment"
  readerMail = "readerMail"
  robotNews = "robotNews"
  intro = "intro"
  outro = "outro"


class IdleTimecode(object):
  def __init__(self, type, duration, startTime, title):
    self.type = type
    self.duration = duration
    self.startTime = startTime
    self.title = title

  def __str__(self):
    return str(self.duration) + " || " + self.title

  def __repr__(self):
    return self.__str__()


def process_video_data(item):

  if re.match("Idle Thumbs \d+", item['snippet']['title']) is None:
    # print "Not a valid episode title:\n " + item['snippet']['title']
    return None

  titleParts = item['snippet']['title'].split(" - ")

  if len(titleParts) < 2:
    print "Something wrong with parsing this title\n " + item['snippet']['title']
    return None

  title = " - ".join(titleParts[1:])

  episode = titleParts[0][12:]

  lines = item['snippet']['description'].split("\n")

  description = ""

  for line in lines:
    if (len(line.split(u" \u2014 ")) > 1):
      break
    description = description + line + "\n"

  timecodes = []
  for line in lines:
    try:
      if (len(line.split(u" \u2014 ")) > 1):
        timestamp = line.split(u" \u2014 ")[0]  # format of hh:mm:ss

        timestamp = timestamp.replace(";", ":")

        timestampParts = timestamp.split(":")

        if len(timestampParts) == 2:
          startTime = int(timestampParts[0])*60 + int(timestampParts[1])

        elif len(timestampParts) == 3:
          startTime = int(timestampParts[0])*3600 + int(timestampParts[1])*60 + int(timestampParts[2])

        else:
          print "Something is wrong with this timecode line\n " + line
          continue

        topic = line.split(u" \u2014 ")[1].split(" - ")[0]

        type = IdleTimecodeType.standard

        if topic == "Reader Mail":
          type = IdleTimecodeType.readerMail

        if topic == "Outro":
          type = IdleTimecodeType.outro

        if topic == "Intro":
          type = IdleTimecodeType.intro

        if topic == "Robot News":
          type == IdleTimecodeType.robotNews

        title = " - ".join(line.split(u" \u2014 ")[1].split(" - ")[1:])

        if(len(timecodes) > 1):
          previousTimecode = timecodes[len(timecodes)-1]

        else:
          previousTimecode = None

        if previousTimecode is not None:
          previousTimecode.duration = startTime - previousTimecode.startTime

        tcDuration = 0

        timecodes.append(IdleTimecode(type, startTime, title, duration=tcDuration))
    except Exception as e:
      print e
      print ">>ooops in "+item['snippet']['title']+"\n "+line

  timecodes[len(timecodes)-1].duration = duration - timecodes[len(timecodes)-1].startTime

  for timecode in timecodes:
    print timecode
  videoId = item['snippet']['resourceId']['videoId']

  return True
  # return IdleVideo(title, episode, description, videoId, 0, duration, timecodes)


if __name__ == "__main__":
  with open('data.json', 'r') as f:
    data = json.load(f)
    for item in data:
      if (process_video_data(item) is not None):
        break
