
# import asyncio
# import websockets
# import threading
# import queue
# import time

# waiting = True
# connected = False
# send_queue = queue.Queue()

# async def send(websocket):
# 	global connected
# 	while connected:
# 		while not send_queue.empty():
# 			message = send_queue.get()
# 			await websocket.send(message)
# 			print(f">>> {message}")


# async def recieve(websocket):
# 	# global connected
# 	while True:
# 		print('awaiting response')

# 		response = await websocket.recv()
# 		print(f"<<< {response}")

# 		if response == 'd':
# 			connected = False

# async def hello():
# 	async with websockets.connect("ws://localhost:3000") as websocket:
# 		global waiting
# 		global connected
# 		waiting = False
# 		connected = True


# 		host_or_client = input('(h)ost or (c)lient? ') == 'h'
# 		if host_or_client:
# 			initialMessage = 'l{"name":"my lobby", "trial": 2, "mods":["API_Multiplayer", "Troubler Slimes", "ATGMChargePack"]}'
# 		else:
# 			initialMessage = 'c{"name":"my lobby", "mods":["API_Multiplayer", "Troubler Slimes", "ATGMChargePack"]}'
		
# 		await websocket.send(initialMessage)
# 		print(f">>> {initialMessage}")

# 		# def thread_send():
# 		# 	asyncio.run(send(websocket))
# 		#
# 		# def thread_recieve():
# 		# 	asyncio.run(recieve(websocket))
# 		#	 
# 		# threading.Thread(target=thread_send).start()
# 		# threading.Thread(target=thread_recieve).start()

# 		task1 = asyncio.create_task(
# 			send(websocket))

# 		task2 = asyncio.create_task(
# 			recieve(websocket))

# 		print(f"started at {time.strftime('%X')}")

# 		# Wait until both tasks are completed (should take
# 		# around 2 seconds.)
# 		await task2
# 		await task1

# 		print(f"finished at {time.strftime('%X')}")

# def socket_manager():
# 	asyncio.run(hello())

# def cmd_input():
# 	global connected
# 	global waiting

# 	while waiting:
# 		time.sleep(1)

# 	while connected:
# 		message = input('Message to server: ')
# 		send_queue.put(message)
# 		time.sleep(1)

# threading.Thread(target=socket_manager).start()
# threading.Thread(target=cmd_input).start()

# import socket

# HOST = '127.0.0.1'  # Standard loopback interface address (localhost)
# PORT = 3000         # Port to listen on (non-privileged ports are > 1023)

# with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
# 	s.connect((HOST, PORT))
# 	s.sendall(b'Hello, world')
# 	data = s.recv(1024)

# print('Received', repr(data))


import client_dependencies.websocket as websocket
import _thread
import time

def on_message(ws, message):
	print("<<<" + message)
	if message == 'd':
		ws.close()

def on_error(ws, error):
	print(error)

def on_close(ws, close_status_code, close_msg):
	print("### closed ###")

def on_open(ws):
	def run(*args):
		# for i in range(3):
		#     time.sleep(1)
		#     ws.send("Hello %d" % i)
		# time.sleep(1)
		# ws.close()

		
		host_or_client = input('(h)ost or (c)lient? ') == 'h'
		if host_or_client:
			initialMessage = 'h{"name":"my lobby", "trial": 2, "mods":["API_Multiplayer", "Troubler Slimes", "ATGMChargePack"]}'
		else:
			initialMessage = 'j{"name":"my lobby", "mods":["API_Multiplayer", "Troubler Slimes", "ATGMChargePack"]}'
		ws.send(initialMessage)

		for i in range(3):
			inp = input()
			ws.send(inp)
		time.sleep(1)
		ws.close()

		print("thread terminating...")
	_thread.start_new_thread(run, ())

if __name__ == "__main__":
	# websocket.enableTrace(True)
	ws = websocket.WebSocketApp("ws://localhost:3000",
							on_open=on_open,
							on_message=on_message,
							on_error=on_error,
							on_close=on_close)

	ws.run_forever()