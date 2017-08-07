import SocketServer,threading

n = 25504352309535290475248970674346405639150033303276037621954645287836414954584485104061261800020387562499019659311665606506084209652278825297538342995446093360707480284955051977871508969158833725741319229528482243960926606982225623875037437446029764584076579733157399563314682454896733000474399703682370015847387660034753890964070709371374885394037462378877025773834640334396506494513394772275132449199231593014288079343099475952658539203870198753180108893634430428519877349292223234156296946657199158953622932685066947832834071847602426570899103186305452954512045960946081356967938725965154991111592790767330692701669
e = 65537

f = open('secret.txt')
d = int(f.readline().strip())
flag = f.readline().strip()

# Translate a number to a string (byte array), for example 5678 = 0x162e = \x16\x2e
def num2str(n):
    d = ('%x' % n)
    if len(d) % 2 == 1:
        d = '0' + d
    return d.decode('hex')

# Translate byte array back to number \x16\x2e = 0x162e = 5678
def str2num(s):
    return int(s.encode('hex'),16)

class ThreadedTCPServer(SocketServer.ThreadingMixIn, SocketServer.TCPServer):
    pass

class MyTCPHandler(SocketServer.BaseRequestHandler):
    def handle(self):
        while True:
            self.request.sendall("\nWelcome to the secure login server, make your choice from the following options:\n1. Register yourself as a user.\n2. Collect flag\n3. Sign a message\n4. Exit\nChoice: ")
            inp = self.request.recv(1024).strip()
            if inp == '1':
                self.request.sendall("Pick a username: ")
                uname = self.request.recv(1024).strip()
                self.request.sendall("Enter your full name: ")
                full = self.request.recv(1024).strip()
                ticket = 'ticket:user|%s|%s' % (uname,full)
                ticket = pow(str2num(ticket),d,n)
                ticket = num2str(ticket)
                self.request.sendall("Your ticket:\n")
                self.request.sendall(ticket.encode('hex') + "\n")
            elif inp == '2':
                self.request.sendall("Enter your ticket: ")
                ticket = self.request.recv(1024).strip()
                try:
                    ticket = int(ticket,16)
                except:
                    ticket = 0
                ticket = pow(ticket,e,n)
                ticket = num2str(ticket)
                if ticket.startswith('ticket:'):
                    if ticket.startswith('ticket:admin|root|'):
                        self.request.sendall("Here you go!\n")
                        self.request.sendall(flag + "\n")
                        break
                    else:
                        self.request.sendall("Sorry that function is only available to admin user root\n")
                else:
                    self.request.sendall("That doesn't seem to be a valid ticket\n")
            elif inp == '3':
                self.request.sendall("Enter your message, hex encoded (i.e. 4142 for AB): ")
                msg = self.request.recv(1024).strip()
                try:
                    msg = msg.decode('hex')
                except:
                    self.request.sendall("That's not a valid message\n!")
                    continue
                msg = '\xff' + msg # Add some padding at the start so users can't use this to sign a ticket
                if str2num(msg) >= n:
                    self.request.sendall("That's not a valid message\n!")
                    continue
                signed = pow(str2num(msg),d,n)
                signed = num2str(signed)
                self.request.sendall("Your signature:\n")
                self.request.sendall(signed.encode('hex') + "\n")
            elif inp == '4':
                self.request.sendall("Bye!\n")
                break
            else:
                self.request.sendall("Invalid choice!\n")

SocketServer.TCPServer.allow_reuse_address = True
server = ThreadedTCPServer(("0.0.0.0", 12345), MyTCPHandler)
server_thread = threading.Thread(target=server.serve_forever)
server_thread.daemon = True
server_thread.start()
server.serve_forever()
