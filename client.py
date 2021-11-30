import socket # for socket
import sys

def init_socket():
	try:
		s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
		print ("Socket successfully created")
	except socket.error as err:
		print ("socket creation failed with error %s" %(err))
	
	# default port for socket
	# port = 1337
	port = 3000
	# port = 59218
	
	try:
		# host_ip = socket.gethostbyname('www.google.com')
		host_ip = 'localhost'
		# host_ip = socket.gethostbyname('riftwizard-matchmaking-server.herokuapp.com')
	except socket.gaierror:
	
		# this means could not resolve the host
		print ("there was an error resolving the host")
		sys.exit()
	
	# connecting to the server
	s.connect((host_ip, port))

	# s.setblocking(False)

	return s


import errno
def get_next_message(s, decode=True):
	try:
		msg = s.recv(4096)
	except socket.error as e:
		err = e.args[0]
		if err == errno.EAGAIN or err == errno.EWOULDBLOCK:
			# no data available
			return None
		else:
			# a "real" error occurred
			print(e)
			exit(1)
	else:
		# got a message, do something :)
		if decode:
			return msg.decode()
		else:
			return msg

def send_message(s, msg, encode=True):
	if encode:
		msg = msg.encode()
	
	print ('>>> ' + str(msg))
	s.send(msg)



import threading

closed = False
def recieve(s):
	global closed
	while not closed:
		msg = get_next_message(s)
		if msg == '':
			closed = True
			s.close()
		if msg != None:
			print('<<< ' + str(msg))

def send(s):
	
	host_or_client = input('(h)ost or (j)oin? ') == 'h'
	if host_or_client:
		initialMessage = 'h{"name":"my lobby", "trial": 2, "mods":["API_Multiplayer", "Troubler Slimes", "ATGMChargePack"]}'
	else:
		initialMessage = 'j{"name":"my lobby", "mods":["API_Multiplayer", "Troubler Slimes", "ATGMChargePack"]}'
	send_message(s, initialMessage)

	global closed
	while not closed:
		msg = input()
		try:
			send_message(s, msg)
		except:
			closed = True
			s.close()




s = init_socket()
threading.Thread(target=recieve, args=[s]).start()
threading.Thread(target=send, args=[s]).start()

# close the connection
# s.close()  