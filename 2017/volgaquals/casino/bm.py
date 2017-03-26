# BM algorithm \ carl@grocid.net

# desired_seq     = '10011101'

# functions to help with doing various stuff
def trunc(monomial_deg):        return '1' if monomial_deg == 0 else 'D^'+str(monomial_deg)
def print_poly(poly_var):       return  ''.join([trunc(x)+'  ' for x, e in enumerate(poly_var) if e != 0])
def parse_seq(poly_var):        return [int(x) for x in poly_var]
def discrepancy(seq,polyCD,i, L):  return sum([seq[i-j]&polyCD[j] for j in range(0,L+1)])%2
def add_poly(poly_a,poly_b, max_poly_len):    return [poly_a[j]^poly_b[j] for j in range(0,max_poly_len)]
def print_line():               print  ''.join(['-']*40)

def bm(desired_seq, max_poly_len):
    max_poly_len    = max_poly_len
    polyCD          = [0]*max_poly_len
    polyCpD         = [0]*max_poly_len
    polyTD          = [0]*max_poly_len

    # init
    polyCD[0]       = 1
    polyCpD[0]      = 1
    polySeq         = parse_seq(desired_seq)
    L               = 0
    l               = 1

    # main loop
    for i in range(0, len(desired_seq)):
        d = discrepancy(polySeq,polyCD,i, L)
        if d != 0:
            polyTD = polyCD
            polyCD =  add_poly(polyCD,[0]*l+polyCpD, max_poly_len)
            if 2*L <= i:
                L = i+1-L
                l = 1
                polyCpD = polyTD
            else:
                l += 1
        else:
            l += 1
    # printout
    return polyCD
    return 'i='+str(i),'s_i='+desired_seq[i],'d='+str(d),\
          'L='+str(L),'l='+str(l),'\tC(D)='+print_poly(polyCD)
